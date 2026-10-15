from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import ai
from ..db import User, get_db
from ..deps import ai_rate_limit
from ..schemas import AnswerReq, CoachSession

router = APIRouter(prefix="/api")


@router.post("/start")
def start(s: CoachSession, user: User = Depends(ai_rate_limit), db: Session = Depends(get_db)):
    out = ai.ask_ai(ai.system_for(db, user, s),
                    'Start the interview with a short greeting and question 1. Return {"question": "..."}')
    return {"question": ai.as_text(out.get("question"))}


@router.post("/answer")
def answer(r: AnswerReq, user: User = Depends(ai_rate_limit), db: Session = Depends(get_db)):
    done = len(r.history) + 1 >= r.total_questions
    nxt = '"next_question": null' if done else '"next_question": "a NEW question that does not repeat earlier ones"'
    prompt = (
        f"Previous turns:\n{ai.transcript(r.history) or '(none)'}\n\n"
        f"Current question: {r.question}\nCandidate answer: {r.answer}\n\n"
        'Return {"feedback": "...", "score": 7, '
        '"skills": {"communication": 7, "technical_depth": 7, "structure": 7, "clarity": 7}, ' + nxt + "}"
    )
    out = ai.ask_ai(ai.system_for(db, user, r), prompt)
    skills_in = out.get("skills") if isinstance(out.get("skills"), dict) else {}
    score = ai.to_int(out.get("score"))
    nq = out.get("next_question")
    return {
        "feedback": ai.as_text(out.get("feedback")),
        "score": score,
        "skills": {k: ai.to_int(skills_in.get(k), score) for k in ai.SKILLS},
        "next_question": None if done or not nq else ai.as_text(nq),
    }


@router.post("/summary")
def summary(s: CoachSession, user: User = Depends(ai_rate_limit), db: Session = Depends(get_db)):
    prompt = (
        f"Full interview:\n{ai.transcript(s.history)}\n\n"
        'Return {"overall_score": 7, "strengths": ["..."], "improvements": ["..."], "next_steps": "a short practice plan"}'
    )
    out = ai.ask_ai(ai.system_for(db, user, s), prompt)
    lst = lambda v: v if isinstance(v, list) else ([v] if v else [])
    return {
        "overall_score": ai.to_int(out.get("overall_score")),
        "strengths": [ai.as_text(x) for x in lst(out.get("strengths"))],
        "improvements": [ai.as_text(x) for x in lst(out.get("improvements"))],
        "next_steps": ai.as_text(out.get("next_steps")),
    }
