from __future__ import annotations

from pathlib import Path
from textwrap import wrap
from typing import Any

from bs4 import BeautifulSoup, NavigableString, Tag
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
INPUT_HTML = ROOT / "docs" / "architecture" / "lifemax-project-architecture-report.html"
OUTPUT_PDF = ROOT / "docs" / "architecture" / "lifemax-project-architecture-report.pdf"

PAGE_W = 1275
PAGE_H = 1650
MARGIN_X = 88
MARGIN_Y = 88
CONTENT_W = PAGE_W - (MARGIN_X * 2)
FOOTER_Y = PAGE_H - 54

COLORS = {
    "bg": (255, 255, 255),
    "ink": (15, 26, 40),
    "muted": (76, 95, 115),
    "cyan": (18, 120, 170),
    "line": (188, 210, 228),
    "panel": (245, 250, 255),
    "accent": (13, 92, 138),
}

FONT_REGULAR = "/System/Library/Fonts/Geneva.ttf"
FONT_MONO = "/System/Library/Fonts/SFNSMono.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


FONTS = {
    "h1": font(FONT_REGULAR, 58),
    "h2": font(FONT_REGULAR, 42),
    "h3": font(FONT_REGULAR, 30),
    "h4": font(FONT_REGULAR, 24),
    "body": font(FONT_REGULAR, 22),
    "small": font(FONT_REGULAR, 19),
    "mono": font(FONT_MONO, 18),
    "footer": font(FONT_REGULAR, 15),
}


def clean_text(text: str) -> str:
    return " ".join(text.split())


def extract_blocks(node: Tag, blocks: list[dict[str, Any]]) -> None:
    for child in node.children:
        if isinstance(child, NavigableString):
            continue
        if not isinstance(child, Tag):
            continue

        if child.name in {"h1", "h2", "h3", "h4", "p"}:
            text = clean_text(child.get_text(" ", strip=True))
            if text:
                blocks.append({"type": child.name, "text": text})
            continue

        if child.name == "pre":
            text = child.get_text("\n", strip=True)
            if text:
                blocks.append({"type": "pre", "text": text})
            continue

        if child.name in {"ul", "ol"}:
            for li in child.find_all("li", recursive=False):
                text = clean_text(li.get_text(" ", strip=True))
                if text:
                    blocks.append({"type": "li", "text": text})
            continue

        if child.name == "table":
            headers = [clean_text(th.get_text(" ", strip=True)) for th in child.find_all("th")]
            rows = []
            tbody = child.find("tbody")
            row_nodes = tbody.find_all("tr", recursive=False) if tbody else child.find_all("tr", recursive=False)
            for row in row_nodes:
                cols = [clean_text(td.get_text(" ", strip=True)) for td in row.find_all("td", recursive=False)]
                if cols:
                    rows.append(cols)
            blocks.append({"type": "table", "headers": headers, "rows": rows})
            continue

        extract_blocks(child, blocks)


def parse_sections() -> list[dict[str, Any]]:
    soup = BeautifulSoup(INPUT_HTML.read_text(encoding="utf-8"), "html.parser")
    parsed = []
    for section in soup.select("main > section"):
        blocks: list[dict[str, Any]] = []
        extract_blocks(section, blocks)
        title = next((block["text"] for block in blocks if block["type"] == "h2"), None)
        parsed.append({"title": title, "blocks": blocks})
    return parsed


class PdfReport:
    def __init__(self) -> None:
        self.pages: list[Image.Image] = []
        self.page_number = 0
        self.image: Image.Image | None = None
        self.draw: ImageDraw.ImageDraw | None = None
        self.y = MARGIN_Y

    def new_page(self) -> None:
        if self.image is not None:
            self.finish_page()
        self.page_number += 1
        self.image = Image.new("RGB", (PAGE_W, PAGE_H), COLORS["bg"])
        self.draw = ImageDraw.Draw(self.image)
        self.y = MARGIN_Y

    def finish_page(self) -> None:
        assert self.image is not None
        assert self.draw is not None
        footer = f"LifeMax OS Architecture Report • Page {self.page_number}"
        self.draw.text((MARGIN_X, FOOTER_Y), footer, fill=COLORS["muted"], font=FONTS["footer"])
        self.pages.append(self.image)
        self.image = None
        self.draw = None

    def close(self) -> None:
        if self.image is not None:
            self.finish_page()

    def save(self, path: Path) -> None:
        self.close()
        if not self.pages:
            raise RuntimeError("No pages were generated.")
        self.pages[0].save(path, "PDF", resolution=144.0, save_all=True, append_images=self.pages[1:])

    def ensure_space(self, needed: int) -> None:
        if self.image is None:
            self.new_page()
        if self.y + needed > FOOTER_Y - 24:
            self.new_page()

    def measure_text(self, text: str, ft: ImageFont.FreeTypeFont) -> tuple[int, int]:
        assert self.draw is not None
        box = self.draw.multiline_textbbox((0, 0), text, font=ft, spacing=6)
        return box[2] - box[0], box[3] - box[1]

    def wrap_text(self, text: str, ft: ImageFont.FreeTypeFont, width: int) -> list[str]:
        assert self.draw is not None
        words = text.split()
        if not words:
            return [""]
        lines: list[str] = []
        current = words[0]
        for word in words[1:]:
            candidate = f"{current} {word}"
            candidate_w = self.draw.textbbox((0, 0), candidate, font=ft)[2]
            if candidate_w <= width:
                current = candidate
            else:
                lines.append(current)
                current = word
        lines.append(current)
        return lines

    def add_text(
        self,
        text: str,
        *,
        ft: ImageFont.FreeTypeFont,
        color: tuple[int, int, int],
        line_height: int,
        gap_after: int = 14,
        indent: int = 0,
        bullet: bool = False,
        monospace: bool = False,
    ) -> None:
        max_width = CONTENT_W - indent
        if monospace:
            raw_lines = text.splitlines() or [""]
            lines: list[str] = []
            for raw in raw_lines:
                if not raw:
                    lines.append("")
                    continue
                lines.extend(self.wrap_text(raw, ft, max_width))
        else:
            lines = self.wrap_text(text, ft, max_width)

        needed = max(len(lines), 1) * line_height + gap_after
        self.ensure_space(needed)
        assert self.draw is not None

        x = MARGIN_X + indent
        for index, line in enumerate(lines):
            prefix = "• " if bullet and index == 0 else ("  " if bullet else "")
            self.draw.text((x, self.y), prefix + line, fill=color, font=ft)
            self.y += line_height
        self.y += gap_after

    def add_rule(self) -> None:
        self.ensure_space(16)
        assert self.draw is not None
        self.draw.line((MARGIN_X, self.y, PAGE_W - MARGIN_X, self.y), fill=COLORS["line"], width=2)
        self.y += 18

    def add_callout(self, title: str, body: str) -> None:
        title_lines = self.wrap_text(title, FONTS["small"], CONTENT_W - 48)
        body_lines = self.wrap_text(body, FONTS["small"], CONTENT_W - 48)
        needed = 28 + len(title_lines) * 26 + len(body_lines) * 24 + 34
        self.ensure_space(needed)
        assert self.draw is not None

        top = self.y
        left = MARGIN_X
        right = PAGE_W - MARGIN_X
        bottom = top + needed - 14
        self.draw.rounded_rectangle((left, top, right, bottom), radius=24, fill=COLORS["panel"], outline=COLORS["line"], width=2)
        y = top + 20
        for line in title_lines:
            self.draw.text((left + 20, y), line, fill=COLORS["accent"], font=FONTS["small"])
            y += 26
        y += 6
        for line in body_lines:
            self.draw.text((left + 20, y), line, fill=COLORS["ink"], font=FONTS["small"])
            y += 24
        self.y = bottom + 18

    def add_table(self, headers: list[str], rows: list[list[str]]) -> None:
        if headers:
            self.add_text(" | ".join(headers), ft=FONTS["small"], color=COLORS["accent"], line_height=25, gap_after=10)
        for row in rows:
            if headers and len(headers) == len(row):
                parts = [f"{headers[i]}: {row[i]}" for i in range(len(row))]
                text = " | ".join(parts)
            else:
                text = " | ".join(row)
            self.add_text(text, ft=FONTS["small"], color=COLORS["ink"], line_height=24, gap_after=6, bullet=True, indent=10)

    def draw_box(self, x: int, y: int, w: int, h: int, title: str, subtitle: str = "") -> None:
        assert self.draw is not None
        self.draw.rounded_rectangle((x, y, x + w, y + h), radius=22, fill=COLORS["panel"], outline=COLORS["line"], width=2)
        self.draw.text((x + 18, y + 16), title, fill=COLORS["ink"], font=FONTS["small"])
        if subtitle:
            lines = self.wrap_text(subtitle, FONTS["footer"], w - 36)
            line_y = y + 50
            for line in lines:
                self.draw.text((x + 18, line_y), line, fill=COLORS["muted"], font=FONTS["footer"])
                line_y += 20

    def draw_arrow(self, start: tuple[int, int], end: tuple[int, int]) -> None:
        assert self.draw is not None
        self.draw.line((start[0], start[1], end[0], end[1]), fill=COLORS["accent"], width=4)
        ex, ey = end
        self.draw.polygon([(ex, ey), (ex - 14, ey - 8), (ex - 14, ey + 8)], fill=COLORS["accent"])

    def architecture_diagram(self) -> None:
        self.new_page()
        self.add_text("High-Level Architecture Diagram", ft=FONTS["h2"], color=COLORS["ink"], line_height=52, gap_after=8)
        self.add_text(
            "This page visualizes the major layers of the system and how the browser experience connects to workflows and protected storage.",
            ft=FONTS["body"],
            color=COLORS["muted"],
            line_height=32,
            gap_after=24,
        )
        top = self.y
        self.draw_box(90, top, 1095, 116, "1. Browser / Frontend", "React UI, forms, route changes, page rendering, dashboard sections")
        self.draw_box(90, top + 160, 1095, 126, "2. Providers and App Shell", "Root layout, auth summary, React Query, session bridge, workspace provider, sidebar and topbar shell")
        self.draw_box(90, top + 334, 520, 146, "3A. API Routes", "/api/onboarding, /api/plan/generate, /api/workspace, /api/account")
        self.draw_box(665, top + 334, 520, 146, "3B. Workflow Logic", "Schemas, intake analysis, stable planner, OpenAI runtime, workspace artifact generation")
        self.draw_box(90, top + 536, 520, 152, "4A. Repository Layer", "Server helpers convert database rows into workspace snapshots and save updated state back safely")
        self.draw_box(665, top + 536, 520, 152, "4B. External Services", "Supabase auth + database, OpenAI APIs, optional Inngest background events")
        self.draw_arrow((637, top + 116), (637, top + 160))
        self.draw_arrow((350, top + 286), (350, top + 334))
        self.draw_arrow((925, top + 286), (925, top + 334))
        self.draw_arrow((350, top + 480), (350, top + 536))
        self.draw_arrow((925, top + 480), (925, top + 536))
        self.y = top + 720
        self.add_callout(
            "Why this matters",
            "The app deliberately separates presentation, state management, workflows, and persistence. That makes the system easier to debug and easier to extend.",
        )

    def route_diagram(self) -> None:
        self.new_page()
        self.add_text("User Route Flow", ft=FONTS["h2"], color=COLORS["ink"], line_height=52, gap_after=8)
        self.add_text(
            "This diagram shows how a real user moves through the product from the public site into onboarding and then into the protected workspace.",
            ft=FONTS["body"],
            color=COLORS["muted"],
            line_height=32,
            gap_after=24,
        )
        top = self.y
        self.draw_box(70, top, 180, 80, "Landing")
        self.draw_box(300, top, 220, 80, "Auth / Example")
        self.draw_box(570, top, 270, 80, "Onboarding Steps")
        self.draw_box(890, top, 140, 80, "Review")
        self.draw_box(1080, top, 120, 80, "Process")
        self.draw_box(120, top + 220, 1030, 140, "Protected Workspace", "Overview • Profile • Plan • Reflection • Progress • Agent Runs • History • Settings")
        self.draw_arrow((250, top + 40), (300, top + 40))
        self.draw_arrow((520, top + 40), (570, top + 40))
        self.draw_arrow((840, top + 40), (890, top + 40))
        self.draw_arrow((1030, top + 40), (1080, top + 40))
        self.draw_arrow((1140, top + 80), (1140, top + 220))
        self.draw_arrow((1140, top + 220), (635, top + 220))
        self.y = top + 410
        self.add_callout(
            "Route design principle",
            "The codebase is organized around real product stages instead of hiding everything inside a single giant screen. That makes the user flow clearer and the code easier to reason about.",
        )

    def plan_diagram(self) -> None:
        self.new_page()
        self.add_text("Plan Generation Pipeline", ft=FONTS["h2"], color=COLORS["ink"], line_height=52, gap_after=8)
        self.add_text(
            "This flowchart shows how completed assessment answers become a generated plan and a saved workspace package.",
            ft=FONTS["body"],
            color=COLORS["muted"],
            line_height=32,
            gap_after=24,
        )
        top = self.y
        self.draw_box(70, top, 190, 84, "User answers")
        self.draw_box(310, top, 235, 84, "/api/plan/generate")
        self.draw_box(595, top, 250, 84, "executePlanGeneration")
        self.draw_box(905, top - 20, 250, 100, "Stable path", "legacy planner / builder workflow")
        self.draw_box(905, top + 140, 250, 120, "AI path", "OpenAI multi-agent runtime")
        self.draw_box(595, top + 310, 250, 90, "Enriched result")
        self.draw_box(905, top + 310, 250, 90, "Persist run + workspace")
        self.draw_arrow((260, top + 42), (310, top + 42))
        self.draw_arrow((545, top + 42), (595, top + 42))
        self.draw_arrow((845, top + 42), (905, top + 30))
        self.draw_arrow((845, top + 42), (905, top + 188))
        self.draw_arrow((1030, top + 260), (1030, top + 310))
        self.draw_arrow((720, top + 84), (720, top + 310))
        self.draw_arrow((845, top + 355), (905, top + 355))
        self.y = top + 450
        self.add_callout(
            "Core architectural idea",
            "The API route is intentionally thin. The real planning decisions live in a reusable workflow function so the system can support both stable and AI modes cleanly.",
        )


def render_report() -> None:
    sections = parse_sections()
    pdf = PdfReport()
    first_text_page = True

    for section in sections:
        title = section["title"]
        if title == "High-Level Architecture Diagram":
            pdf.architecture_diagram()
        elif title == "Routing and Page System":
            pdf.route_diagram()
        elif title == "Plan Generation Pipeline":
            pdf.plan_diagram()

        if first_text_page:
            pdf.new_page()
            first_text_page = False
        else:
            pdf.new_page()

        for block in section["blocks"]:
            kind = block["type"]
            if kind == "h1":
                pdf.add_text(block["text"], ft=FONTS["h1"], color=COLORS["ink"], line_height=72, gap_after=24)
            elif kind == "h2":
                pdf.add_text(block["text"], ft=FONTS["h2"], color=COLORS["ink"], line_height=50, gap_after=10)
                pdf.add_rule()
            elif kind == "h3":
                pdf.add_text(block["text"], ft=FONTS["h3"], color=COLORS["accent"], line_height=36, gap_after=6)
            elif kind == "h4":
                pdf.add_text(block["text"], ft=FONTS["h4"], color=COLORS["accent"], line_height=30, gap_after=6)
            elif kind == "p":
                pdf.add_text(block["text"], ft=FONTS["body"], color=COLORS["ink"], line_height=32, gap_after=12)
            elif kind == "li":
                pdf.add_text(block["text"], ft=FONTS["body"], color=COLORS["ink"], line_height=30, gap_after=8, indent=10, bullet=True)
            elif kind == "pre":
                pdf.add_text(block["text"], ft=FONTS["mono"], color=COLORS["ink"], line_height=24, gap_after=16, monospace=True)
            elif kind == "table":
                pdf.add_table(block["headers"], block["rows"])

    pdf.save(OUTPUT_PDF)
    print(OUTPUT_PDF)


if __name__ == "__main__":
    render_report()
