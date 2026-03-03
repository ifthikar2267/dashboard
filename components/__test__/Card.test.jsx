import { render, screen } from "@testing-library/react";
import Card, { CardHeader, CardBody, CardFooter } from "../common/Card";


  test("renders children inside Card", () => {
    render(<Card>My Card Content</Card>);

    // Check if content is in the document
    expect(screen.getByText("My Card Content")).toBeInTheDocument();
  });

  test("renders CardHeader correctly", () => {
    render(
      <CardHeader>Header Content</CardHeader>
    );

    const header = screen.getByText("Header Content");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("px-6 py-4 border-b border-gray-200");
  });

  test("renders CardBody correctly", () => {
    render(
      <CardBody>Body Content</CardBody>
    );

    const body = screen.getByText("Body Content");
    expect(body).toBeInTheDocument();
    expect(body).toHaveClass("p-6");
  });

  test("renders CardFooter correctly", () => {
    render(
      <CardFooter>Footer Content</CardFooter>
    );

    const footer = screen.getByText("Footer Content");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("px-6 py-4 border-t border-gray-200");
  });

