# Dictionary JSON Format Guide

This guide explains how to create a `dictionary.json` file for the Japanese Flashcard application.

## JSON Structure

```json
{
  "metadata": { ... },
  "categories": [ ... ]
}
```

## Metadata Object

The `metadata` object contains configuration for the dictionary:

```json
{
  "metadata": {
    "title": "📚 JLPT N5 Vocabulary",
    "subtitle": "Core vocabulary for basic Japanese communication",
    "primaryLanguage": "ja",
    "meaningLanguage": "en",
    "modes": [
      {
        "id": "jp-en",
        "label": "🇯🇵 → 🇬🇧"
      },
      {
        "id": "en-jp",
        "label": "🇬🇧 → 🇯🇵"
      }
    ],
    "readBothLabel": "🔊 Read both Japanese and English"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Main title displayed in the app header |
| `subtitle` | string | Yes | Subtitle/description shown below the title |
| `primaryLanguage` | string | Yes | ISO language code for the primary language (e.g., `"ja"` for Japanese) |
| `meaningLanguage` | string | Yes | ISO language code for translations (e.g., `"en"` for English) |
| `modes` | array | Yes | Array of study mode objects (see below) |
| `readBothLabel` | string | Yes | Label for the "read both languages" toggle option |

### Mode Object

Each mode in the `modes` array:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier. Use `"jp-en"` for Japanese→English, `"en-jp"` for English→Japanese |
| `label` | string | Yes | Display label with emoji flags (e.g., `"🇯🇵 → 🇬🇧"`) |

## Categories Array

The `categories` array contains groups of related words:

```json
{
  "categories": [
    {
      "id": "basic-numbers",
      "name": "Basic Numbers",
      "words": [ ... ]
    },
    {
      "id": "greetings",
      "name": "Greetings",
      "words": [ ... ]
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the category (kebab-case recommended) |
| `name` | string | Yes | Display name for the category |
| `words` | array | Yes | Array of word objects |

## Word Object

Each word in a category's `words` array:

```json
{
  "japanese": "こんにちは",
  "romaji": "konnichiwa",
  "meaning": "hello, good afternoon",
  "example": "こんにちは、元気ですか",
  "exampleMeaning": "Hello, how are you?"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `japanese` | string | Yes | The word in Japanese (hiragana, katakana, or kanji). Use `/` for alternate readings (e.g., `"し/よん"`) |
| `romaji` | string | Yes | Romanized pronunciation. Use `/` for alternates (e.g., `"shi/yon"`) |
| `meaning` | string | Yes | English translation/meaning |
| `example` | string | Yes | Example sentence in Japanese using the word |
| `exampleMeaning` | string | Yes | English translation of the example sentence |

## Complete Example

```json
{
  "metadata": {
    "title": "📚 JLPT N5 Vocabulary",
    "subtitle": "Core vocabulary for basic Japanese communication",
    "primaryLanguage": "ja",
    "meaningLanguage": "en",
    "modes": [
      {
        "id": "jp-en",
        "label": "🇯🇵 → 🇬🇧"
      },
      {
        "id": "en-jp",
        "label": "🇬🇧 → 🇯🇵"
      }
    ],
    "readBothLabel": "🔊 Read both Japanese and English"
  },
  "categories": [
    {
      "id": "greetings",
      "name": "Greetings",
      "words": [
        {
          "japanese": "こんにちは",
          "romaji": "konnichiwa",
          "meaning": "hello, good afternoon",
          "example": "こんにちは、元気ですか",
          "exampleMeaning": "Hello, how are you?"
        },
        {
          "japanese": "おはようございます",
          "romaji": "ohayou gozaimasu",
          "meaning": "good morning (polite)",
          "example": "おはようございます、先生",
          "exampleMeaning": "Good morning, teacher"
        }
      ]
    },
    {
      "id": "basic-numbers",
      "name": "Basic Numbers",
      "words": [
        {
          "japanese": "いち",
          "romaji": "ichi",
          "meaning": "one",
          "example": "一つください",
          "exampleMeaning": "Please give me one"
        },
        {
          "japanese": "に",
          "romaji": "ni",
          "meaning": "two",
          "example": "二人で行きます",
          "exampleMeaning": "Two people will go"
        }
      ]
    }
  ]
}
```

## Best Practices

1. **Category IDs**: Use kebab-case (e.g., `"basic-numbers"`, `"time-expressions"`)

2. **Alternate readings**: Use `/` to separate alternate pronunciations:
   - `"japanese": "し/よん"` (shi or yon)
   - `"romaji": "shi/yon"`

3. **Examples**: 
   - Keep examples short and natural
   - Use the vocabulary word in context
   - Provide accurate translations

4. **Consistent formatting**:
   - Use proper Japanese punctuation (。、)
   - Capitalize English translations appropriately

5. **Category organization**: Group words logically (numbers, greetings, verbs, etc.)
