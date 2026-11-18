import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AnimatePresence, m, motion } from "framer-motion";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { MotionProvider } from "@/components/motion/MotionProvider";

describe("MotionProvider (LazyMotion strict)", () => {
  it("renderiza componentes `m` normalmente", () => {
    render(
      <MotionProvider>
        <m.div data-testid="box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          oi
        </m.div>
      </MotionProvider>
    );
    expect(screen.getByTestId("box")).toHaveTextContent("oi");
  });

  it("falha com um `motion.*` perdido (strict)", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <MotionProvider>
          <motion.div />
        </MotionProvider>
      )
    ).toThrow(/LazyMotion/);
    err.mockRestore();
  });

  it("AnimatePresence conclui a saída (domAnimation inclui exit)", async () => {
    function Toggle() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(false)}>fechar</button>
          <AnimatePresence>
            {open && (
              <m.div key="x" data-testid="panel" exit={{ opacity: 0, transition: { duration: 0.01 } }}>
                painel
              </m.div>
            )}
          </AnimatePresence>
        </>
      );
    }
    render(
      <MotionProvider>
        <Toggle />
      </MotionProvider>
    );
    await userEvent.click(screen.getByText("fechar"));
    await waitFor(() => expect(screen.queryByTestId("panel")).not.toBeInTheDocument());
  });
});
