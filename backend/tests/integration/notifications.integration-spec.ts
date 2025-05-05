import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { NotificationService } from '../../src/notifications/notifications.service';
import { Subscription } from '../../src/notifications/entities/subscription.entity';
import { SubscriptionRepository } from '../../src/notifications/repositories/subscription.repository';
import { TicketService } from '../../src/ticket/ticket.service';

const mockSubscriptionRepository = {
  find: jest.fn(),
  findOneByEndpoint: jest.fn(),
  findTicketSubscribers: jest.fn(),
  findEmailSubscribers: jest.fn(),
  saveSubscription: jest.fn(),
  updatePreferencesByEndpoint: jest.fn(),
  delete: jest.fn(),
  deleteByEndpoint: jest.fn(),
  save: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    if (key === 'VAPID_PUBLIC_KEY') return 'test_public_key';
    if (key === 'VAPID_PRIVATE_KEY') return 'test_private_key';
    if (key === 'VAPID_MAILTO') return 'mailto:test@example.com';
    return defaultValue;
  }),
  getOrThrow: jest.fn((key: string) => {
    if (key === 'VAPID_PUBLIC_KEY') return 'test_public_key';
    if (key === 'VAPID_PRIVATE_KEY') return 'test_private_key';
    throw new Error(`Config key ${key} not found`);
  }),
};

const mockTicketService = {
  getTickets: jest.fn().mockResolvedValue([]),
};

describe('NotificationService <-> SubscriptionRepository (Integration)', () => {
  let service: NotificationService;
  let repository: SubscriptionRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: SubscriptionRepository,
          useValue: mockSubscriptionRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TicketService,
          useValue: mockTicketService,
        }
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get<SubscriptionRepository>(SubscriptionRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePreferences', () => {
    it('should call repository.updatePreferencesByEndpoint with correct args', async () => {
      const endpoint = 'http://example.com/123';
      const prefs = { notifyOnTicket: false };
      mockSubscriptionRepository.updatePreferencesByEndpoint.mockResolvedValue(true);

      await service.updatePreferences(endpoint, prefs);

      expect(repository.updatePreferencesByEndpoint).toHaveBeenCalledTimes(1);
      expect(repository.updatePreferencesByEndpoint).toHaveBeenCalledWith(endpoint, prefs);
    });

    it('should return false if repository returns false', async () => {
      const endpoint = 'http://nonexistent.com/456';
      const prefs = { notifyOnEmail: false };
      mockSubscriptionRepository.updatePreferencesByEndpoint.mockResolvedValue(false);
      const result = await service.updatePreferences(endpoint, prefs);
      expect(result).toBe(false);
    });
  });

  describe('getTicketSubscribers', () => {
    it('should call repository.findTicketSubscribers', async () => {
      const mockSubs = [{ id: 1, endpoint: 'a', notifyOnTicket: true }];
      mockSubscriptionRepository.findTicketSubscribers.mockResolvedValue(mockSubs);

      const result = await service.getTicketSubscribers();

      expect(result).toEqual(mockSubs);
      expect(repository.findTicketSubscribers).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEmailSubscribers', () => {
    it('should call repository.findEmailSubscribers', async () => {
      const mockSubs = [{ id: 2, endpoint: 'b', notifyOnEmail: true }];
      mockSubscriptionRepository.findEmailSubscribers.mockResolvedValue(mockSubs);
      const result = await service.getEmailSubscribers();
      expect(result).toEqual(mockSubs);
      expect(repository.findEmailSubscribers).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeUser', () => {
    it('should update keys if subscription exists', async () => {
      const existingSub = new Subscription();
      existingSub.id = 1;
      existingSub.endpoint = 'http://example.com/sub1';
      existingSub.p256dh = 'old_p256dh';
      existingSub.auth = 'old_auth';
      existingSub.userId = null;

      const updatedSubData = { ...existingSub, p256dh: 'new_p256dh', auth: 'new_auth', userId: 123 };

      mockSubscriptionRepository.findOneByEndpoint.mockResolvedValue(existingSub);
      mockSubscriptionRepository.save.mockResolvedValue(updatedSubData as Subscription);

      const result = await service.subscribeUser('http://example.com/sub1', 'new_p256dh', 'new_auth', 123);

      expect(repository.findOneByEndpoint).toHaveBeenCalledWith('http://example.com/sub1');
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        endpoint: 'http://example.com/sub1',
        p256dh: 'new_p256dh',
        auth: 'new_auth',
        userId: 123
      }));
      expect(result).toEqual(updatedSubData);
      expect(repository.saveSubscription).not.toHaveBeenCalled();
    });

    it('should call repository.saveSubscription if subscription does not exist', async () => {
      const endpoint = 'http://new.example.com/sub2';
      const p256dh = 'key1';
      const auth = 'key2';
      const userId = null;
      const newSub = { id: 5, endpoint, p256dh, auth, userId, notifyOnEmail: true, notifyOnTicket: true };

      mockSubscriptionRepository.findOneByEndpoint.mockResolvedValue(null);
      mockSubscriptionRepository.saveSubscription.mockResolvedValue(newSub as Subscription);

      const result = await service.subscribeUser(endpoint, p256dh, auth, userId);

      expect(repository.findOneByEndpoint).toHaveBeenCalledWith(endpoint);
      expect(repository.saveSubscription).toHaveBeenCalledWith(endpoint, p256dh, auth, userId, undefined);
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual(newSub);
    });
  });
});