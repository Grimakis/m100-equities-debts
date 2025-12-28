#!/usr/bin/env python3
"""Convert Chance Cards CSV to BASIC DATA statements.

Reads sheet_Chance_Cards.csv and generates sparse-encoded DATA statements
for the TRS-80 Model 100 BASIC program.

Output format: Each card stores up to 6 values (stock_idx, change) pairs
Stock indices: CE=1, GR=2, ME=3, PI=4, SH=5, ST=6, TR=7, UN=8, UR=9, VA=10
"""

import argparse
import csv
from pathlib import Path


# Stock ticker to index mapping
STOCK_MAP = {
    'CE': 1, 'GR': 2, 'ME': 3, 'PI': 4, 'SH': 5,
    'ST': 6, 'TR': 7, 'UN': 8, 'UR': 9, 'VA': 10
}


def encode_card(row, header):
    """
    Encode a single chance card row into sparse format.

    Returns a variable-length list: [stock1_idx, change1, stock2_idx, change2, ..., 0]
    Uses 0 as terminator for stock index.
    Supports up to 4 stocks per card.
    """
    encoded = []

    # Iterate through stock tickers in order
    for stock_ticker in STOCK_MAP.keys():
        # Find column index in header
        try:
            col_idx = header.index(stock_ticker)
        except ValueError:
            continue  # Stock not in header

        # Get value from row
        value = row[col_idx].strip() if col_idx < len(row) else ''

        if value and value != '0':
            try:
                change = int(value)
                stock_idx = STOCK_MAP[stock_ticker]
                encoded.append(stock_idx)
                encoded.append(change)
            except ValueError:
                pass  # Skip non-integer values

    # Add single 0 terminator
    encoded.append(0)

    # Warn if more than 4 stocks (should not happen)
    if len(encoded) > 9:  # 4 stocks * 2 + terminator = 9
        print(f"Warning: Card has more than 4 stocks affected: {len(encoded)//2} stocks")

    return encoded


def get_stock_names(encoded, row, header):
    """Get human-readable stock names for comment."""
    names = []
    for i in range(0, 8, 2):
        stock_idx = encoded[i]
        if stock_idx == 0:
            break
        change = encoded[i + 1]

        # Find stock ticker from index
        stock_ticker = [k for k, v in STOCK_MAP.items() if v == stock_idx][0]
        sign = '+' if change > 0 else ''
        names.append(f"{stock_ticker} {sign}{change}")

    comment = ", ".join(names) if names else "no changes"

    # Check for special card 36 (dividend)
    card_num = row[0].strip() if row else ''
    if card_num == '36':
        comment += " (special: also pays $2/share dividend)"

    return comment


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        '--input',
        default='data/sheet_Chance_Cards.csv',
        help='Path to Chance Cards CSV file'
    )
    parser.add_argument(
        '--output',
        default='data/chance_cards_data.txt',
        help='Output file for BASIC DATA statements'
    )
    parser.add_argument(
        '--start-line',
        type=int,
        default=8000,
        help='Starting line number for DATA statements'
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        raise SystemExit(f"Error: {input_path} not found")

    # Read CSV
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        raise SystemExit("Error: CSV file is empty")

    # First row is header
    header = rows[0]

    # Find stock columns (CE, GR, ME, etc.)
    stock_columns = []
    for col in header:
        col_clean = col.strip()
        if col_clean in STOCK_MAP:
            stock_columns.append(col_clean)

    if not stock_columns:
        raise SystemExit("Error: No stock columns found in CSV header")

    print(f"Found {len(stock_columns)} stock columns: {', '.join(stock_columns)}")

    # Process each card (skip header row)
    cards = []
    for row in rows[1:]:
        if not row or not row[0].strip():
            continue  # Skip empty rows

        card_num = row[0].strip()
        try:
            int(card_num)  # Verify it's a number
        except ValueError:
            continue  # Skip non-card rows

        encoded = encode_card(row, header)
        comment = get_stock_names(encoded, row, header)
        cards.append((card_num, encoded, comment))

    print(f"Encoded {len(cards)} cards")

    # Generate BASIC DATA statements
    line_num = args.start_line
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"{line_num} REM --- CHANCE CARDS DATA (36 CARDS) ---\n")
        line_num += 10

        for card_num, encoded, comment in cards:
            # Pad to exactly 8 values for fixed-width DATA statements
            padded = encoded[:8]  # Take first 8 values
            while len(padded) < 8:
                padded.append(0)   # Pad with zeros to reach 8

            data_str = ','.join(str(v) for v in padded)

            f.write(f"{line_num} DATA {data_str}")
            # Align comment column (assuming 8 values = ~16 chars for data)
            f.write(f"  : REM Card {card_num}: {comment}\n")
            line_num += 10

    print(f"Wrote BASIC DATA statements to {output_path}")
    print(f"Lines {args.start_line} to {line_num - 10}")
    print(f"\nNext available line number: {line_num}")


if __name__ == '__main__':
    main()
