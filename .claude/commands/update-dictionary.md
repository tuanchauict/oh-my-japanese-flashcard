Update the BJT dictionary from a CSV file and generate audio for new words.

## Input
- CSV file path: $ARGUMENTS (e.g. `~/Downloads/BJT 言語 - Sheet1 (2).csv`)
- Dictionary: `assets/dictionaries/bjt-language/dictionary.json`

## CSV format
```
No.,Từ Mới,Nghĩa trong tiếng Việt,Cách đọc,Ví dụ,Category
1,下回る,"Thấp hơn, dưới mức",したまわる,例文,W260303
```

The `Category` column is optional. When present (e.g. `W260303`), it means the word was learned on that date (WYYMMDD format).

## Steps

1. **Parse CSV** and compare with the current dictionary to find new words only.
2. **Categorize each new word** into one of the existing thematic categories based on its meaning:
   - `economy-finance` — Kinh tế & Tài chính (financial terms, economic indicators, prices)
   - `work-office` — Công việc & Văn phòng (office tasks, documents, procedures)
   - `hr-career` — Nhân sự & Tuyển dụng (hiring, roles, career attitudes)
   - `business-strategy` — Kinh doanh & Chiến lược (decisions, planning, management)
   - `risk-issues` — Rủi ro & Xử lý (problems, risks, crises)
   - `time-situations` — Thời gian & Tình huống (timing, situations, moments)
   - `expression-language` — Diễn đạt & Ngôn từ (expression words, adverbs)
   - `daily-life` — Đời sống & Thường ngày (daily life, misc)
   - `meeting-planning` — Họp & Kế hoạch (meetings, scheduling, logistics)
   - `system-issues` — Hệ thống & Sự cố (systems, IT, incidents)
   - `news-business` — Tin tức & Kinh doanh (news vocabulary, corporate)
   - `expressions-grammar` — Ngữ pháp & Cách nói (grammar patterns, set phrases)
   - `general-vocabulary` — Từ vựng chung (general vocab that doesn't fit elsewhere)
3. **For words with a Category value** (e.g. `W260303`):
   - Add the word to the appropriate thematic category (step 2)
   - ALSO add a copy of the word to the date-based category (e.g. `w260303`)
   - If the date category doesn't exist yet, create it with format: `{"id": "w260401", "name": "📅 W260401 (01/04/2026)", "words": [...]}`
4. **For words without a Category**: only add to the thematic category.
5. **Clean up meanings**: remove stray quotes, trim whitespace. Add romaji if missing (use hiragana reading).
6. **Save** the updated dictionary JSON.
7. **Generate audio** for new words by running: `PIPENV_IGNORE_VIRTUALENVS=1 pipenv run python scripts/generate_audio.py bjt-language`
   - The script runs in incremental mode by default (skips existing audio files).
8. **Print a summary** of what was added: new word count, which categories were updated, audio generation results.
9. **Commit and push** with message format: `feat: update BJT dictionary with N new words`
