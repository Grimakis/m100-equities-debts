# EQUITIES & DEBTS (TRS-80 Model 100)

This is a faithful tribute to the 1964 3M board game **Stocks & Bonds: The Game of Investments**, built to run on the TRS-80 Model 100 (or the Virtual T emulator). Play with 1–4 people, manage a portfolio of 10 companies, and see who builds the largest net worth after 10 years of dice-ruled markets.

## How to Play

### Setup
- Pick how many human players: 1 to 4.
- Enter one name per player; everyone starts with $5,000.
- Choose a **Dice Mode** (keep that choice in mind, it affects how prices move each year):
  1. **Standard** – one roll per year applies to every stock.
  2. **Year-One Individual** – the first year rolls separately for each stock, then reverts to a single roll.
  3. **All Individual (with 2/12 override)** – every stock rolls on its own each year, but if any roll comes up 2 or 12, that number becomes the official roll for the whole year.

### Annual Loop
Each “year” runs as follows:
1. The game randomly chooses **Bear** or **Bull** market.
2. Dice rolls (per the mode above) feed into the price tables for all 10 securities.
3. Stocks at $150+ trigger a 2-for-1 split (price halves, shares double).
4. Each player takes turns buying or selling shares (in lots of 10) while watching their cash and holdings on the status line.
5. After trading, a year-end summary prints each player’s portfolio value.
6. Repeat for 10 years, then proceed to the Close year and final payoff.

### Trading Controls
- **Select a stock** by pressing its number (1–10).
- **Buy or sell** in 10-share increments; type how many and confirm.
- Press `0` when you’re done trading for that player.
- Use the on-screen menu for `Buy`, `Sell`, `History`, or `Back`.
- When prompted, just press a key to continue through dividends and chance cards.

## Dice Mode Impacts
- **D: <number>** on the year banner tells you what single roll drove that year’s prices.
- **D: IND** means the game used per-stock rolls instead of a single value.
- For mode 3, if a 2 or 12 override happens, the banner switches from `IND` to that number so everyone knows the whole market locked in on that extreme roll.

## Tips for Winning
- A balanced portfolio (income+growth) survives the ups and downs best.
- Watch the chance cards—they can cause splits, bankruptcies, or sudden rallies.
- Hold enough cash to jump on a dip and weigh the odds before selling.

## Running the Game
- **Virtual T** (recommended): drag the tokenized `.BA` file into the emulator, type `RUN`, and follow the prompts.
- **Real TRS-80 Model 100**: load `SBONDS.BA` from disk/cassette, type `LOAD`, then `RUN`.

## Other Notes
- Every stock starts at $100, changes with dice rolls, and caps between 0–255.
- When a stock enters bankruptcy (e.g., drops to $0), it stays worthless until a chance card rescues it.
- After 10 years, the player with the highest **Net Worth = Cash + (Shares × Price)** wins.

Enjoy the strategy, adapt to the luck, and may the best investor win!
