import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToneChipGroup } from "@/components/ui/tone-chip";

const OPTIONS = [
  { value: "flirty", label: "Paquera" },
  { value: "funny", label: "Engraçado" },
  { value: "casual", label: "Casual" },
];

function Controlled({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState("flirty");
  return (
    <ToneChipGroup
      label="Tom da resposta"
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe("ToneChipGroup", () => {
  it("expõe radiogroup rotulado com radios e aria-checked", () => {
    render(<ToneChipGroup label="Tom da resposta" options={OPTIONS} value="funny" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: "Tom da resposta" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Engraçado" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Paquera" })).toHaveAttribute("aria-checked", "false");
  });

  it("roving tabindex: só o selecionado entra no Tab", () => {
    render(<ToneChipGroup label="Tom" options={OPTIONS} value="casual" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Casual" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Paquera" })).toHaveAttribute("tabindex", "-1");
  });

  it("clique chama onChange com a chave da API", async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "Casual" }));
    expect(onChange).toHaveBeenCalledWith("casual");
  });

  it("setas, Home e End movem a seleção e o foco (com volta ao início)", async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    screen.getByRole("radio", { name: "Paquera" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("funny");
    expect(screen.getByRole("radio", { name: "Engraçado" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("flirty");
    expect(screen.getByRole("radio", { name: "Paquera" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("casual");
    await userEvent.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith("flirty");
    await userEvent.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith("casual");
  });
});
