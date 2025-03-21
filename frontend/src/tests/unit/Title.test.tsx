import { render, screen } from "@testing-library/react";
import Title from "../../components/Title";

describe("Title Component", () => {
    it("renders the title text correctly", () => {
        const testText = "Hello, World!";
        render(<Title text={testText} />);

        const titleElement = screen.getByRole("heading", { level: 1 });
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveTextContent(testText);
    });
});
