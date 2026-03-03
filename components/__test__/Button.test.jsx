import { render, screen } from "@testing-library/react";
import Button from "../common/Button";


//testing basic render test
test("renders button with children", () => {
  render(<Button>Click Me</Button>);

  const button = screen.getByRole("button", { name: /click me/i });

  expect(button).toBeInTheDocument();
});

//testing primary variant applies by default
test("applies primary variant by default", () => {
  render(<Button>Test</Button>);

  const button = screen.getByRole("button");

  expect(button.className).toMatch(/bg-blue-600/);
}); 

//testing secondary variant applies 
test("applies secondary variant styles", () => {
  render(<Button variant="secondary">Test</Button>);

  const button = screen.getByRole("button");

  expect(button.className).toMatch(/bg-gray-200/);
});

//testing size of the button
test("applies large size styles", () => {
  render(<Button size="lg">Large</Button>);

  const button = screen.getByRole("button");

  expect(button.className).toMatch(/px-6/);
});

//testing if button disabled cursor not allowed
test("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button");

    expect(button.className).toMatch(/cursor-not-allowed/)
})