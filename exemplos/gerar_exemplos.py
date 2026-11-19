"""Gera as planilhas de exemplo para conferir o cálculo dos escudos.

Uso:  python3 exemplos/gerar_exemplos.py

Cria, nesta pasta:
  - entrada_starters.xlsx, entrada_movers.xlsx, entrada_flyers.xlsx
      planilhas de notas para enviar na Calculadora de Escudos
  - entrada_com_erros.xlsx
      planilha com notas inválidas, para ver as mensagens de erro
  - resumo_escudos.xlsx
      escudos esperados de cada criança nas três provas, e as faixas de cada prova

As faixas abaixo foram escritas à mão, a partir das tabelas de conversão,
e não usam o código do site: servem para conferir o site de forma independente.
"""

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

HERE = Path(__file__).parent

# Faixas (de, até) para 1, 2, 3, 4 e 5 escudos. Zero = zero escudos.
BANDS = {
    "STARTERS": {
        "rw": [(1, 5), (6, 10), (11, 15), (16, 20), (21, 25)],
        "l": [(1, 4), (5, 8), (9, 12), (13, 16), (17, 20)],
    },
    "MOVERS": {
        "rw": [(1, 7), (8, 14), (15, 21), (22, 28), (29, 35)],
        "l": [(1, 5), (6, 10), (11, 15), (16, 20), (21, 25)],
    },
    "FLYERS": {
        "rw": [(1, 10), (11, 20), (21, 30), (31, 40), (41, 50)],
        "l": [(1, 5), (6, 10), (11, 15), (16, 20), (21, 25)],
    },
}
EXAMS = list(BANDS)


def top(exam, skill, shields):
    """Maior nota que ainda dá `shields` escudos."""
    return BANDS[exam][skill][shields - 1][1]


def bottom(exam, skill, shields):
    """Menor nota que já dá `shields` escudos."""
    return BANDS[exam][skill][shields - 1][0]


# Cada criança testa um tipo de nota. Cada valor é uma função (prova -> nota),
# ou um valor fixo. None = célula em branco.
CASES = [
    ("Ana Silva", "Nota máxima em tudo",
     lambda e: top(e, "rw", 5), lambda e: top(e, "l", 5), 5),
    ("Bruno Costa", "Menor nota possível acima de zero (1)",
     1, 1, 1),
    ("Carla Souza", "Maior nota da faixa de 1 escudo",
     lambda e: top(e, "rw", 1), lambda e: top(e, "l", 1), 1),
    ("Daniel Lima", "Menor nota da faixa de 2 escudos",
     lambda e: bottom(e, "rw", 2), lambda e: bottom(e, "l", 2), 2),
    ("Eduarda Rocha", "Maior nota da faixa de 3 escudos",
     lambda e: top(e, "rw", 3), lambda e: top(e, "l", 3), 3),
    ("Felipe Alves", "Menor nota da faixa de 4 escudos",
     lambda e: bottom(e, "rw", 4), lambda e: bottom(e, "l", 4), 4),
    ("Gabriela Dias", "Maior nota da faixa de 4 escudos",
     lambda e: top(e, "rw", 4), lambda e: top(e, "l", 4), 4),
    ("Henrique Melo", "Menor nota da faixa de 5 escudos",
     lambda e: bottom(e, "rw", 5), lambda e: bottom(e, "l", 5), 5),
    ("Isabela Nunes", "Zero em tudo (0)",
     0, 0, 0),
    ("João Pedro Ramos", "Letra z / Z em tudo",
     "z", "Z", "z"),
    ("Larissa Gomes", "Faltou: tudo em branco",
     None, None, None),
    ("Mateus Barros", "Faltou só no Reading/Writing (em branco)",
     None, lambda e: top(e, "l", 3), 3),
    ("Natália Pinto", "Faltou só no Speaking (em branco)",
     lambda e: top(e, "rw", 5), lambda e: top(e, "l", 5), None),
    ("Otávio Castro", "Notas digitadas como texto",
     lambda e: f" {bottom(e, 'rw', 3)} ", lambda e: str(bottom(e, "l", 3)), "2"),
    ("Paula Ferreira", "Notas misturadas",
     lambda e: top(e, "rw", 2), lambda e: bottom(e, "l", 5), 0),
    ("Quésia Martins", "Notas no meio das faixas",
     lambda e: round(top(e, "rw", 5) * 0.62), lambda e: round(top(e, "l", 5) * 0.38), 4),
    ("Rafael Teixeira", "Notas no meio das faixas",
     lambda e: round(top(e, "rw", 5) * 0.86), lambda e: round(top(e, "l", 5) * 0.5), 3),
]


def value(v, exam):
    return v(exam) if callable(v) else v


def shields_for(score, exam, skill):
    """Escudos esperados. Em branco, 0, z ou Z = 0 escudos (mostrado como z)."""
    if score is None or str(score).strip().lower() in ("", "0", "z"):
        return "z"
    n = int(str(score).strip())
    if skill == "s":
        return n  # Speaking já vem em escudos
    for i, (lo, hi) in enumerate(BANDS[exam][skill], start=1):
        if lo <= n <= hi:
            return i
    raise ValueError(f"nota {n} fora da faixa em {exam} {skill}")


def shown(v):
    return "(em branco)" if v is None else v


HEADER_FILL = PatternFill("solid", fgColor="DDE6F5")
EXAM_FILLS = {"STARTERS": "FCE9D9", "MOVERS": "E2F0D9", "FLYERS": "E8E0F4"}


def style_header(ws, row=1):
    for cell in ws[row]:
        if cell.value is not None:
            cell.font = Font(bold=True)
            cell.fill = HEADER_FILL
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def autosize(ws, min_width=8, max_width=45):
    for col in ws.columns:
        width = max(len(str(c.value)) if c.value is not None else 0 for c in col)
        ws.column_dimensions[get_column_letter(col[0].column)].width = max(min_width, min(max_width, width + 2))


def write_inputs():
    for exam in EXAMS:
        wb = Workbook()
        ws = wb.active
        ws.title = "Notas"
        ws.append(["Nome", "Reading/Writing", "Listening", "Speaking"])
        for name, _, rw, l, s in CASES:
            ws.append([name, value(rw, exam), value(l, exam), value(s, exam)])
        style_header(ws)
        autosize(ws)
        wb.save(HERE / f"entrada_{exam.lower()}.xlsx")


def write_errors():
    wb = Workbook()
    ws = wb.active
    ws.title = "Notas"
    ws.append(["Nome", "Reading/Writing", "Listening", "Speaking"])
    rows = [
        ("Aluno Nota Alta", 99, 10, 3),          # acima do máximo
        ("Aluno Decimal", 12.5, 10, 3),          # não é inteiro
        ("Aluno Negativo", 10, -1, 3),           # negativo
        ("Aluno Speaking Alto", 10, 10, 6),      # Speaking é em escudos: máximo 5
        ("Aluno Texto", "dez", 10, 3),           # texto que não é número
        (None, 10, 10, 3),                       # notas sem nome
    ]
    for r in rows:
        ws.append(list(r))
    style_header(ws)
    autosize(ws)
    wb.save(HERE / "entrada_com_erros.xlsx")


def write_summary():
    wb = Workbook()

    # --- Aba 1: escudos de cada criança nas três provas
    ws = wb.active
    ws.title = "Resumo"
    cols = ["RW nota", "RW escudos", "L nota", "L escudos", "Speaking escudos"]
    n = len(cols)
    ws.append(["Criança", "Tipo de nota"] + [e for e in EXAMS for _ in cols])
    ws.append(["", ""] + cols * len(EXAMS))
    for i, exam in enumerate(EXAMS):
        c0 = 3 + i * n
        ws.merge_cells(start_row=1, start_column=c0, end_row=1, end_column=c0 + n - 1)
    ws.merge_cells("A1:A2")
    ws.merge_cells("B1:B2")
    for name, case, rw, l, s in CASES:
        row = [name, case]
        for exam in EXAMS:
            vrw, vl, vs = value(rw, exam), value(l, exam), value(s, exam)
            row += [
                shown(vrw), shields_for(vrw, exam, "rw"),
                shown(vl), shields_for(vl, exam, "l"),
                shields_for(vs, exam, "s"),
            ]
        ws.append(row)
    style_header(ws, 1)
    style_header(ws, 2)
    for i, exam in enumerate(EXAMS):
        fill = PatternFill("solid", fgColor=EXAM_FILLS[exam])
        for col in range(3 + i * n, 3 + (i + 1) * n):
            for r in range(1, ws.max_row + 1):
                ws.cell(r, col).fill = fill
                ws.cell(r, col).alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            if cols[(col - 3) % n].endswith("escudos"):
                for r in range(3, ws.max_row + 1):
                    ws.cell(r, col).font = Font(bold=True)
    autosize(ws)
    for col in range(3, 3 + n * len(EXAMS)):
        ws.column_dimensions[get_column_letter(col)].width = 11
    ws.freeze_panes = "C3"
    ws.append([])
    ws.append(["RW = Reading/Writing, L = Listening. z = zero escudos (aparecem apagados)."])
    ws.append(["Speaking já vem em escudos (0 a 5) em todas as provas. Em branco, 0 ou z = zero escudos."])

    # --- Uma aba por prova: nota enviada e escudos esperados
    for exam in EXAMS:
        we = wb.create_sheet(exam.capitalize())
        we.append([
            "Criança", "Tipo de nota",
            "Reading/Writing (nota)", "Reading/Writing (escudos)",
            "Listening (nota)", "Listening (escudos)",
            "Speaking (escudos enviados)", "Speaking (escudos)",
        ])
        for name, case, rw, l, s in CASES:
            vrw, vl, vs = value(rw, exam), value(l, exam), value(s, exam)
            we.append([
                name, case,
                shown(vrw), shields_for(vrw, exam, "rw"),
                shown(vl), shields_for(vl, exam, "l"),
                shown(vs), shields_for(vs, exam, "s"),
            ])
        style_header(we)
        autosize(we)

    # --- Faixas de conversão das três provas
    wr = wb.create_sheet("Faixas")
    wr.append(["Prova", "Habilidade", "0 escudos", "1", "2", "3", "4", "5"])
    for exam in EXAMS:
        for skill, label in (("rw", "Reading/Writing"), ("l", "Listening")):
            maximum = BANDS[exam][skill][-1][1]
            wr.append([exam, f"{label} (0–{maximum})", "0, z ou em branco"]
                      + [f"{lo}–{hi}" for lo, hi in BANDS[exam][skill]])
        wr.append([exam, "Speaking (0–5)", "0, z ou em branco", "1", "2", "3", "4", "5"])
    style_header(wr)
    autosize(wr)

    wb.save(HERE / "resumo_escudos.xlsx")


if __name__ == "__main__":
    write_inputs()
    write_errors()
    write_summary()
    print("Planilhas geradas em", HERE)
