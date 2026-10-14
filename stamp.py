#!/usr/bin/env python3
"""Stamp the stylesheet and script links in every page with a content hash.

Why this exists: the pages are plain static files, so `css/appview.css` is
the same URL whether or not its contents changed. GitHub Pages serves it
with `max-age=600`, and a browser that already has a copy will keep using
it — which is how an edit can be live on the server and still invisible in
the tab. Local serving sends `no-store`, but the shared link does not.

Giving each URL a `?v=<hash of the file>` makes a changed file a different
URL, so it is fetched, and an unchanged file keeps its hash and stays
cached. Run it after editing anything under css/ or js/ and before
committing:

    python stamp.py

It rewrites the `<link>` and `<script src>` tags in place and prints what
moved. Safe to run twice — an unchanged file keeps the same stamp.
"""

import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
PAGES = sorted(ROOT.glob("*.html"))

# href="css/x.css" or src="js/x.js", with or without an existing ?v=
LINK = re.compile(r'((?:href|src)=")((?:css|js)/[A-Za-z0-9_.-]+\.(?:css|js))(\?v=[A-Za-z0-9]+)?(")')


def stamp(path: pathlib.Path) -> str:
    """Short content hash. Different bytes, different URL."""
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


def main() -> int:
    cache: dict[str, str] = {}
    touched = 0

    for page in PAGES:
        text = page.read_text(encoding="utf-8")

        def swap(m: re.Match) -> str:
            attr, rel, _old, close = m.groups()
            target = ROOT / rel
            if not target.exists():
                print(f"  ! {page.name}: {rel} is missing, left alone")
                return m.group(0)
            if rel not in cache:
                cache[rel] = stamp(target)
            return f"{attr}{rel}?v={cache[rel]}{close}"

        new = LINK.sub(swap, text)
        if new != text:
            page.write_text(new, encoding="utf-8")
            touched += 1
            print(f"  stamped {page.name}")

    if not touched:
        print("  everything already current")
    print(f"\n{len(cache)} asset(s), {touched} page(s) rewritten")
    return 0


if __name__ == "__main__":
    sys.exit(main())
