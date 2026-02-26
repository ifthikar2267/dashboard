import { render, screen, fireEvent } from "@testing-library/react";
import FAQSection from "../hotels/FAQSection";

describe("FAQSection Component", () => {
  let faqs;
  let handleChange;

  beforeEach(() => {
    faqs = [
      { question_en: "Q1 EN", question_ar: "Q1 AR", answer_en: "A1 EN", answer_ar: "A1 AR" },
    ];
    handleChange = jest.fn();
  });

  test("renders initial FAQ", () => {
    render(<FAQSection faqs={faqs} onChange={handleChange} />);

    expect(screen.getByText("FAQ #1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Q1 EN")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Q1 AR")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A1 EN")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A1 AR")).toBeInTheDocument();
  });

  test("adds a new FAQ when Add button is clicked", () => {
    render(<FAQSection faqs={faqs} onChange={handleChange} />);

    const addButton = screen.getByText(/Add FAQ/i);
    fireEvent.click(addButton);

    // onChange should be called with new array including empty FAQ
    expect(handleChange).toHaveBeenCalledWith([
      ...faqs,
      { question_en: "", question_ar: "", answer_en: "", answer_ar: "" },
    ]);
  });

  test("removes an FAQ when Delete button is clicked", () => {
    render(<FAQSection faqs={faqs} onChange={handleChange} />);

    const deleteButton = screen.getByTitle("Remove FAQ");
    fireEvent.click(deleteButton);

    // onChange should be called with empty array
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  test("updates FAQ input values correctly", () => {
    render(<FAQSection faqs={faqs} onChange={handleChange} />);

    const questionEnInput = screen.getByPlaceholderText("Enter question in English");

    fireEvent.change(questionEnInput, { target: { value: "Updated Q1 EN" } });

    // onChange should be called with updated FAQ
    expect(handleChange).toHaveBeenCalledWith([
      { ...faqs[0], question_en: "Updated Q1 EN" },
    ]);
  });

  test("renders empty state when no FAQs", () => {
    render(<FAQSection faqs={[]} onChange={handleChange} />);

    expect(screen.getByText("No FAQs added yet")).toBeInTheDocument();

    const addFirstButton = screen.getByText(/\+ Add your first FAQ/i);
    fireEvent.click(addFirstButton);

    expect(handleChange).toHaveBeenCalledWith([
      { question_en: "", question_ar: "", answer_en: "", answer_ar: "" },
    ]);
  });
});