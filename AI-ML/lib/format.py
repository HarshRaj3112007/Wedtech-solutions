"""
formatINR — Indian Rupee currency formatter.

Formats numbers in the Indian numbering system (lakhs/crores notation):
  ₹X,XX,XXX  — not the Western ₹X,XXX,XXX format.

Handles values up to ₹10 Crores (₹10,00,00,000) correctly.
"""


def format_inr(value: int | float) -> str:
    """Format a numeric value as Indian Rupees with lakhs/crores notation.

    Examples:
        format_inr(150000)    -> '₹1,50,000'
        format_inr(12500000)  -> '₹1,25,00,000'
        format_inr(0)         -> '₹0'
        format_inr(-500000)   -> '-₹5,00,000'
    """
    if value is None:
        return "N/A"

    is_negative = value < 0
    value = abs(int(round(value)))

    if value == 0:
        return "₹0"

    s = str(value)

    # Indian grouping: last 3 digits, then groups of 2
    if len(s) <= 3:
        formatted = s
    else:
        last_three = s[-3:]
        remaining = s[:-3]
        # Group remaining digits in pairs from the right
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        formatted = ",".join(groups) + "," + last_three

    result = f"₹{formatted}"
    if is_negative:
        result = f"-{result}"
    return result


def format_inr_short(value: int | float) -> str:
    """Format as shortened Indian notation (e.g. ₹1.5L, ₹2.1Cr).

    Examples:
        format_inr_short(150000)    -> '₹1.5L'
        format_inr_short(25000000)  -> '₹2.5Cr'
        format_inr_short(5000)      -> '₹5,000'
    """
    if value is None:
        return "N/A"

    abs_val = abs(value)
    sign = "-" if value < 0 else ""

    if abs_val >= 1_00_00_000:  # 1 Crore
        cr = abs_val / 1_00_00_000
        return f"{sign}₹{cr:.1f}Cr"
    elif abs_val >= 1_00_000:  # 1 Lakh
        lakh = abs_val / 1_00_000
        return f"{sign}₹{lakh:.1f}L"
    else:
        return format_inr(value)
