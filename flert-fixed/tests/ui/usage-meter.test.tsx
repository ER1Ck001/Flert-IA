import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsageMeter } from "@/components/analyze/UsageMeter";

describe("UsageMeter", () => {
  it("é um progressbar com valores corretos", () => {
    render(<UsageMeter todayCount={3} dailyLimit={10} isLifetime={false} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "10");
    expect(bar).toHaveAccessibleName(/análises/i);
    expect(screen.queryByText(/restam/i)).not.toBeInTheDocument();
  });

  it("mostra aviso quando todayCount >= dailyLimit - 2", () => {
    render(<UsageMeter todayCount={8} dailyLimit={10} isLifetime={false} />);
    expect(screen.getByText(/restam 2/i)).toBeInTheDocument();
  });

  it("fica oculto quando dailyLimit é null", () => {
    const { container } = render(<UsageMeter todayCount={3} dailyLimit={null} isLifetime={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("fica oculto no Vitalício", () => {
    const { container } = render(<UsageMeter todayCount={3} dailyLimit={10} isLifetime />);
    expect(container).toBeEmptyDOMElement();
  });
});
