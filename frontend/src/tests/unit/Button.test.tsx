import { render, screen, fireEvent } from "@testing-library/react";

import Button from "../../components/Button";

describe("Button Component", () => {
    test("renders with correct text and styles", () => {
        render(
            <Button backgroundColor="blue" text="Click Me" textColor="white" />
        );

        const buttonElement = screen.getByRole("button", { name: /click me/i });

        expect(buttonElement).toBeInTheDocument();
        expect(buttonElement).toHaveStyle({
            backgroundColor: "blue",
            color: "white",
        });
    });

    test("calls onClick when clicked", () => {
        const handleClick = jest.fn();
        render(
            <Button
                onClick={handleClick}
                backgroundColor="red"
                text="Press Me"
                textColor="black"
            />
        );

        const buttonElement = screen.getByRole("button", { name: /press me/i });

        fireEvent.click(buttonElement);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
