// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PricingCards } from "@/components/pricing-cards";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PricingCards", () => {
  it("shows progress only on the selected plan and blocks duplicate requests", () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal("fetch", fetchMock);
    render(<PricingCards />);

    const creator = screen.getByRole("button", { name: "Choose Creator" });
    const studio = screen.getByRole("button", { name: "Choose Studio" });
    const business = screen.getByRole("button", { name: "Choose Business" });

    fireEvent.click(creator);

    expect(screen.getByRole("button", { name: "Opening Stripe…" })).toBeDisabled();
    expect(studio).toBeEnabled();
    expect(business).toBeEnabled();
    expect(studio).not.toHaveAttribute("aria-disabled");
    expect(business).not.toHaveAttribute("aria-disabled");

    fireEvent.click(studio);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
