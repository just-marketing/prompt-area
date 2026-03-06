import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef } from "react"
import { PromptArea } from "../prompt-area"

describe("PromptArea", () => {
  it("renders a textarea element", () => {
    render(<PromptArea />)
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("has default placeholder text", () => {
    render(<PromptArea />)
    expect(screen.getByPlaceholderText("Enter your prompt...")).toBeInTheDocument()
  })

  it("allows custom placeholder", () => {
    render(<PromptArea placeholder="Type here..." />)
    expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<PromptArea className="custom-class" />)
    expect(screen.getByRole("textbox")).toHaveClass("custom-class")
  })

  it("forwards ref to textarea", () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<PromptArea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it("handles user input", async () => {
    const user = userEvent.setup()
    render(<PromptArea />)
    const textarea = screen.getByRole("textbox")
    await user.type(textarea, "Hello world")
    expect(textarea).toHaveValue("Hello world")
  })

  it("supports disabled state", () => {
    render(<PromptArea disabled />)
    expect(screen.getByRole("textbox")).toBeDisabled()
  })

  it("passes through HTML textarea attributes", () => {
    render(<PromptArea rows={5} maxLength={100} name="prompt" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("rows", "5")
    expect(textarea).toHaveAttribute("maxlength", "100")
    expect(textarea).toHaveAttribute("name", "prompt")
  })

  it("has correct displayName", () => {
    expect(PromptArea.displayName).toBe("PromptArea")
  })
})
