from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from bs4 import BeautifulSoup, Tag
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "docs/architecture/lifemax-project-architecture-report.html"
PDF_PATH = ROOT / "docs/architecture/lifemax-project-architecture-report.pdf"

PAGE_W = 1654
PAGE_H = 2339
MARGIN_X = 120
MARGIN_Y = 110
CONTENT_W = PAGE_W - MARGIN_X * 2

BG = "#f8fbff"
INK = "#102033"
MUTED = "#49617c"
ACCENT = "#0a85c8"
LINE = "#c9d7e6"
CARD = "#edf5fb"
DARK_CARD = "#dcebf7"


def font_path() -> str:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    return ""


FONT_PATH = font_path()


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if FONT_PATH:
        return ImageFont.truetype(FONT_PATH, size)
    return ImageFont.load_default()


FONT_H1 = load_font(54)
FONT_H2 = load_font(38)
FONT_H3 = load_font(26)
FONT_BODY = load_font(24)
FONT_SMALL = load_font(20)
FONT_CODE = load_font(21)


def clean(text: str) -> str:
    return " ".join(text.replace("\xa0", " ").split())


def text_height(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    box = draw.multiline_textbbox((0, 0), text, font=font, spacing=8)
    return int(box[3] - box[1])


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, width: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        box = draw.textbbox((0, 0), candidate, font=font)
        if box[2] - box[0] <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def split_paragraph(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, width: int) -> list[str]:
    paragraphs = [clean(part) for part in text.split("\n") if clean(part)]
    lines: list[str] = []
    for index, paragraph in enumerate(paragraphs):
        lines.extend(wrap_text(draw, paragraph, font, width))
        if index < len(paragraphs) - 1:
            lines.append("")
    return lines


@dataclass
class Page:
    image: Image.Image
    draw: ImageDraw.ImageDraw
    y: int


class PDFComposer:
    def __init__(self) -> None:
        self.pages: list[Image.Image] = []
        self.new_page()

    def new_page(self) -> None:
        image = Image.new("RGB", (PAGE_W, PAGE_H), BG)
        draw = ImageDraw.Draw(image)
        self.page = Page(image=image, draw=draw, y=MARGIN_Y)
        self.pages.append(image)
        self.draw_header_rule()

    def draw_header_rule(self) -> None:
        self.page.draw.line((MARGIN_X, PAGE_H - 90, PAGE_W - MARGIN_X, PAGE_H - 90), fill=LINE, width=2)

    def ensure(self, height: int) -> None:
        if self.page.y + height > PAGE_H - 140:
            self.new_page()

    def add_cover(self, title: str, subtitle: str, toc: list[str]) -> None:
        d = self.page.draw
        d.rounded_rectangle((MARGIN_X, 90, PAGE_W - MARGIN_X, 330), radius=42, fill=DARK_CARD, outline=ACCENT, width=4)
        d.text((MARGIN_X + 40, 140), "LifeMax OS", font=FONT_H3, fill=ACCENT)
        d.multiline_text((MARGIN_X + 40, 190), title, font=FONT_H1, fill=INK, spacing=12)
        d.multiline_text((MARGIN_X + 40, 315), subtitle, font=FONT_BODY, fill=MUTED, spacing=10)

        self.page.y = 420
        self.add_heading("What this document covers", level=2)
        self.add_paragraph(
            "This report explains the LifeMax OS codebase as a complete product system: frontend pages, backend APIs, data storage, onboarding, plan generation, authentication, styling, and deployment. It is written for a reader who is not already a programmer."
        )
        self.add_heading("Section map", level=2)
        for item in toc:
            self.add_bullet(item)

    def add_heading(self, text: str, level: int = 2) -> None:
        font = FONT_H2 if level == 2 else FONT_H3
        color = INK if level == 2 else ACCENT
        h = text_height(self.page.draw, text, font) + 10
        self.ensure(h + 20)
        self.page.draw.text((MARGIN_X, self.page.y), text, font=font, fill=color)
        self.page.y += h + (18 if level == 2 else 10)

    def add_paragraph(self, text: str, font: ImageFont.ImageFont = FONT_BODY, color: str = INK) -> None:
        lines = split_paragraph(self.page.draw, text, font, CONTENT_W)
        wrapped = "\n".join(lines)
        h = text_height(self.page.draw, wrapped, font) + 8
        self.ensure(h + 12)
        self.page.draw.multiline_text((MARGIN_X, self.page.y), wrapped, font=font, fill=color, spacing=8)
        self.page.y += h + 16

    def add_bullet(self, text: str) -> None:
        bullet_x = MARGIN_X + 20
        text_x = MARGIN_X + 54
        width = CONTENT_W - 54
        lines = wrap_text(self.page.draw, text, FONT_BODY, width)
        wrapped = "\n".join(lines)
        h = text_height(self.page.draw, wrapped, FONT_BODY) + 4
        self.ensure(h + 10)
        self.page.draw.ellipse((bullet_x - 8, self.page.y + 10, bullet_x + 8, self.page.y + 26), fill=ACCENT)
        self.page.draw.multiline_text((text_x, self.page.y), wrapped, font=FONT_BODY, fill=INK, spacing=8)
        self.page.y += h + 10

    def add_code(self, text: str) -> None:
        lines = text.strip("\n").splitlines()
        wrapped_lines: list[str] = []
        for line in lines:
            wrapped_lines.extend(wrap_text(self.page.draw, line or " ", FONT_CODE, CONTENT_W - 50))
        wrapped = "\n".join(wrapped_lines)
        h = text_height(self.page.draw, wrapped, FONT_CODE) + 48
        self.ensure(h + 14)
        x1, y1 = MARGIN_X, self.page.y
        x2, y2 = PAGE_W - MARGIN_X, self.page.y + h
        self.page.draw.rounded_rectangle((x1, y1, x2, y2), radius=26, fill=CARD, outline=LINE, width=3)
        self.page.draw.multiline_text((x1 + 24, y1 + 22), wrapped, font=FONT_CODE, fill=INK, spacing=7)
        self.page.y = y2 + 16

    def add_flowchart(self, title: str, nodes: list[str]) -> None:
        self.add_heading(title, level=2)
        card_h = 120
        gap = 40
        total_h = len(nodes) * card_h + (len(nodes) - 1) * gap + 20
        self.ensure(total_h)
        box_x1 = MARGIN_X + 120
        box_x2 = PAGE_W - MARGIN_X - 120
        for idx, node in enumerate(nodes):
            y1 = self.page.y + idx * (card_h + gap)
            y2 = y1 + card_h
            fill = DARK_CARD if idx % 2 == 0 else CARD
            self.page.draw.rounded_rectangle((box_x1, y1, box_x2, y2), radius=30, fill=fill, outline=ACCENT, width=3)
            lines = wrap_text(self.page.draw, node, FONT_BODY, box_x2 - box_x1 - 50)
            wrapped = "\n".join(lines)
            th = text_height(self.page.draw, wrapped, FONT_BODY)
            self.page.draw.multiline_text((box_x1 + 25, y1 + (card_h - th) / 2 - 2), wrapped, font=FONT_BODY, fill=INK, spacing=7)
            if idx < len(nodes) - 1:
                cx = (box_x1 + box_x2) / 2
                ay1 = y2 + 8
                ay2 = y2 + gap - 10
                self.page.draw.line((cx, ay1, cx, ay2), fill=ACCENT, width=5)
                self.page.draw.polygon([(cx - 10, ay2 - 14), (cx + 10, ay2 - 14), (cx, ay2 + 8)], fill=ACCENT)
        self.page.y += total_h + 10

    def save(self, path: Path) -> None:
        rgb_pages = [page.convert("RGB") for page in self.pages]
        first, rest = rgb_pages[0], rgb_pages[1:]
        first.save(path, "PDF", resolution=144.0, save_all=True, append_images=rest)


def first_text(tag: Tag, selector: str) -> str:
    found = tag.select_one(selector)
    return clean(found.get_text(" ", strip=True)) if found else ""


def extract_toc(soup: BeautifulSoup) -> list[str]:
    items: list[str] = []
    for heading in soup.select("section.page h2"):
        text = clean(heading.get_text(" ", strip=True))
        if text:
            items.append(text)
    return items


def unique_texts(elements: Iterable[Tag]) -> list[tuple[str, str]]:
    items: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for elem in elements:
        kind = elem.name
        text = clean(elem.get_text(" ", strip=True))
        if not text:
            continue
        key = (kind, text)
        if key not in seen:
            seen.add(key)
            items.append(key)
    return items


def build_pdf() -> None:
    soup = BeautifulSoup(HTML_PATH.read_text(encoding="utf-8"), "html.parser")
    composer = PDFComposer()

    cover = soup.select_one("section.cover")
    cover_title = first_text(cover, "h1") if cover else "LifeMax OS Project Architecture Walkthrough"
    subtitle = "Full codebase explanation, architecture overview, major components, data flow, and deployment model."
    toc = extract_toc(soup)
    composer.add_cover(cover_title, subtitle, toc)

    sections = soup.select("section.page")
    diagram_titles = {
        "High-Level Architecture Diagram": [
            "Public pages and onboarding collect structured user inputs.",
            "Server routes validate payloads and call the planning workflow.",
            "Stable or AI planning engines build the plan package.",
            "Supabase stores profiles, runs, plans, reflections, and settings.",
            "Workspace pages render the saved result for repeat use.",
        ],
        "Routing and Page System": [
            "Landing page introduces the product and directs users to sign in, sign up, or run the example.",
            "Auth pages establish a session or demo mode.",
            "Onboarding routes collect assessment data step by step.",
            "Generation routes build the plan and write the first workspace state.",
            "Protected /app routes expose overview, plan, progress, history, reflection, and settings.",
        ],
        "Plan Generation Pipeline": [
            "The browser submits onboarding answers to /api/plan/generate.",
            "The API route validates the request and chooses stable or AI mode.",
            "The workflow generates a structured build package.",
            "The repository writes plan state into Supabase-backed workspace tables.",
            "The workspace provider reloads the saved data and the app renders the result.",
        ],
    }

    for section in sections:
        title = first_text(section, "h2")
        if not title:
            continue
        composer.new_page()
        composer.add_heading(title, level=2)

        if title in diagram_titles:
            composer.add_flowchart(title, diagram_titles[title])
            intro_paragraphs = unique_texts(section.find_all(["p"], recursive=True))
            for kind, text in intro_paragraphs[:4]:
                composer.add_paragraph(text)
            continue

        for kind, text in unique_texts(section.find_all(["h3", "p", "li", "pre"], recursive=True)):
            if kind == "h3":
                composer.add_heading(text, level=3)
            elif kind == "li":
                composer.add_bullet(text)
            elif kind == "pre":
                composer.add_code(text)
            else:
                composer.add_paragraph(text)

    composer.save(PDF_PATH)


if __name__ == "__main__":
    build_pdf()
