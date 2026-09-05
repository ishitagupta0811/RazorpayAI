"""
Decision Engine & Silence Gatekeeper for Proactive Sales Agent.
Evaluates recommendation relevance, computes confidence scores, and enforces silence guardrails.
"""

from typing import Dict, Any, List, Optional

class DecisionEngine:
    def __init__(self, confidence_threshold: float = 0.65):
        self.confidence_threshold = confidence_threshold

    def evaluate_candidates(
        self,
        upsell_candidate: Optional[Dict[str, Any]],
        cross_sell_candidate: Optional[Dict[str, Any]],
        wishlist_candidate: Optional[Dict[str, Any]],
        event_type: str,
        session_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prioritizes candidate recommendations and applies silence gatekeeper guardrails.
        """
        candidates = []

        if upsell_candidate and upsell_candidate.get("confidence_score", 0) >= self.confidence_threshold:
            candidates.append(upsell_candidate)

        if cross_sell_candidate and cross_sell_candidate.get("confidence_score", 0) >= self.confidence_threshold:
            candidates.append(cross_sell_candidate)

        if wishlist_candidate and wishlist_candidate.get("confidence_score", 0) >= self.confidence_threshold:
            candidates.append(wishlist_candidate)

        if not candidates:
            return {
                "recommendation_id": "rec_silent",
                "type": "SILENT",
                "confidence_score": 0.0,
                "product": None,
                "explanation": None,
                "quick_actions": []
            }

        # Sort candidates by confidence score descending
        candidates.sort(key=lambda c: c.get("confidence_score", 0), reverse=True)
        return candidates[0]
