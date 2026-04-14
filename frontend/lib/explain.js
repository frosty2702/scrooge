/**
 * Generates plain-English explanations from XAI feature importance data.
 * Designed for non-technical users — no jargon.
 */

const FEATURE_NAMES = {
  returns:    "recent price performance",
  volatility: "market stability",
  momentum:   "price momentum",
  regime:     "overall market conditions",
};

const FEATURE_DETAIL = {
  returns:    "how well each asset had been doing lately",
  volatility: "how stable or risky each asset was at the time",
  momentum:   "whether asset prices were accelerating or slowing down",
  regime:     "whether the broader market was in a bull, bear, or sideways phase",
};

const FEATURE_ACTION = {
  returns:    "shifted money toward assets that were recently performing well",
  volatility: "moved money into more stable assets to reduce risk",
  momentum:   "followed trends — backing assets gaining speed and reducing exposure to fading ones",
  regime:     "adjusted the entire portfolio based on the current market environment",
};

function humanName(key) {
  return FEATURE_NAMES[key] || key.replace(/_/g, " ");
}

/**
 * Returns a paragraph of plain-English explanation.
 * @param {Array} aggImportance - [{name, pct}, ...] sorted by pct desc
 * @param {Object} metrics - {sharpe, volatility, max_drawdown}
 * @param {number} totalReturn - total_return_pct
 */
export function explainInPlainEnglish(aggImportance, metrics, totalReturn) {
  if (!aggImportance?.length) return null;

  const top = aggImportance[0];
  const second = aggImportance[1];
  const third = aggImportance[2];

  const topName = humanName(top.name);
  const topAction = FEATURE_ACTION[top.name] || `paid close attention to ${FEATURE_DETAIL[top.name] || top.name}`;

  // Opening sentence — what the AI primarily focused on
  let text = `The AI primarily focused on ${topName} (${top.pct}% of its decisions). In practice, this means it ${topAction}. `;

  // Second driver
  if (second) {
    const secondName = humanName(second.name);
    const secondDetail = FEATURE_DETAIL[second.name] || second.name;
    text += `It also considered ${secondName} (${second.pct}%), meaning it weighed ${secondDetail} before committing to each allocation. `;
  }

  // Third driver (brief)
  if (third && third.pct >= 10) {
    text += `${humanName(third.name)} played a supporting role at ${third.pct}%. `;
  }

  // Risk assessment
  if (metrics?.sharpe != null) {
    if (metrics.sharpe >= 1.5) {
      text += "The result was a strong risk-adjusted performance — you got solid returns without taking on excessive risk. ";
    } else if (metrics.sharpe >= 0.8) {
      text += "The strategy struck a reasonable balance between return and risk. ";
    } else if (metrics.sharpe >= 0) {
      text += "The returns were modest given the level of risk involved in this period. ";
    } else {
      text += "This period was challenging — the returns didn't compensate well for the risk taken. ";
    }
  }

  // Return verdict
  if (totalReturn != null) {
    if (totalReturn >= 20) {
      text += `Overall, the AI grew your investment by ${totalReturn.toFixed(1)}% — a strong outcome.`;
    } else if (totalReturn >= 5) {
      text += `Overall, your investment grew by ${totalReturn.toFixed(1)}%.`;
    } else if (totalReturn >= 0) {
      text += `Your investment ended slightly up at +${totalReturn.toFixed(1)}%.`;
    } else {
      text += `Your investment ended down ${totalReturn.toFixed(1)}% — market conditions were difficult during this period.`;
    }
  }

  return text;
}

/**
 * Returns a short one-liner verdict for use in tight spaces.
 * @param {Array} aggImportance
 * @param {number} totalReturn
 */
export function shortVerdict(aggImportance, totalReturn) {
  if (!aggImportance?.length) return null;
  const top = aggImportance[0];
  const topName = humanName(top.name);
  const returnStr = totalReturn != null
    ? (totalReturn >= 0 ? `+${totalReturn.toFixed(1)}%` : `${totalReturn.toFixed(1)}%`)
    : null;
  return `Driven by ${topName}${returnStr ? ` · ${returnStr} return` : ""}`;
}
