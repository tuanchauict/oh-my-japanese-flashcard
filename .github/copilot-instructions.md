# Copilot Instructions

## Python Environment

Before running any Python commands or scripts, always ensure the virtual environment is activated:

```bash
source venv/bin/activate
```

Or use the venv Python directly:

```bash
./venv/bin/python <script.py>
```

## Audio Generation

When generating audio for dictionaries, use:

```bash
source venv/bin/activate && python3 scripts/generate_audio.py <dictionary-name>
```

Where `<dictionary-name>` is the folder name under `assets/dictionaries/` (e.g., `banking`, `real-estate`, `n5-dictionary`).
