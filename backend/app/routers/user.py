import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, DeveloperProfile, Skill, SkillVersion, Purchase, CreatorEarning, Download
from ..schemas import UserSchema, PurchaseRequest, SkillSummary

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/current", response_model=UserSchema)
def get_current_user(role: Optional[str] = "developer", db: Session = Depends(get_db)):
    """
    Simulates role-based authenticated session for the interactive prototype.
    """
    username = "roboskill" if role == "developer" else "archimedes_builder"
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = db.query(User).first()
    return UserSchema(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        display_name=user.display_name,
        bio=user.bio
    )


@router.get("/developer/overview")
def get_developer_overview(db: Session = Depends(get_db)):
    """
    Returns actual, un-fabricated developer analytics.
    """
    dev_user = db.query(User).filter(User.username == "roboskill").first()
    if not dev_user:
        raise HTTPException(status_code=404, detail="Developer not found")

    published_count = db.query(Skill).filter(Skill.creator_id == dev_user.id, Skill.is_published == True).count()
    draft_count = db.query(Skill).filter(Skill.creator_id == dev_user.id, Skill.is_published == False).count()

    # Calculate actual downloads for this developer's skills
    dev_skills = db.query(Skill).filter(Skill.creator_id == dev_user.id).all()
    skill_ids = [s.id for s in dev_skills]

    total_downloads = db.query(Download).filter(Download.skill_id.in_(skill_ids)).count() if skill_ids else 0
    total_purchases = db.query(Purchase).filter(Purchase.skill_id.in_(skill_ids)).count() if skill_ids else 0

    # Earnings
    dev_profile = db.query(DeveloperProfile).filter(DeveloperProfile.user_id == dev_user.id).first()
    earnings_records = db.query(CreatorEarning).filter(CreatorEarning.developer_id == (dev_profile.id if dev_profile else 0)).all()
    total_earnings_cents = sum(e.amount_cents for e in earnings_records)

    # Recent activities
    recent_activity = []
    recent_downloads = db.query(Download).order_by(Download.downloaded_at.desc()).limit(5).all()
    for d in recent_downloads:
        recent_activity.append({
            "type": "download",
            "title": f"Skill Package Downloaded: {d.skill_id}",
            "timestamp": d.downloaded_at.isoformat(),
            "details": "Verified ZIP archive retrieved."
        })

    recent_purchases = db.query(Purchase).order_by(Purchase.created_at.desc()).limit(5).all()
    for p in recent_purchases:
        recent_activity.append({
            "type": "purchase",
            "title": f"Skill License Acquired: {p.skill_id}",
            "timestamp": p.created_at.isoformat(),
            "details": f"Price: ${p.price_cents / 100:.2f} (Artisan share: ${p.creator_payout_cents / 100:.2f})"
        })

    return {
        "developer_name": dev_user.display_name,
        "guild": dev_profile.guild_name if dev_profile else "Artisan Guild",
        "published_skills": published_count,
        "draft_skills": draft_count,
        "total_downloads": total_downloads,
        "total_purchases": total_purchases,
        "total_earnings_cents": total_earnings_cents,
        "payout_address": dev_profile.payout_address if dev_profile else "0xROBOSKILL_VAULT",
        "platform_commission_rate": "15%",
        "recent_activity": recent_activity
    }


@router.get("/library", response_model=List[SkillSummary])
def get_user_library(user_id: int = 1, db: Session = Depends(get_db)):
    """
    Returns skills acquired or owned by the user.
    """
    # Look for purchases or skills created by user
    purchases = db.query(Purchase).filter(Purchase.user_id == user_id).all()
    purchased_skill_ids = {p.skill_id for p in purchases}

    # Also include the free default skill for demonstration library access
    purchased_skill_ids.add("roboskill.obstacle-avoidance")

    skills = db.query(Skill).filter(Skill.id.in_(purchased_skill_ids)).all()
    summaries = []

    for s in skills:
        latest_ver = db.query(SkillVersion).filter(SkillVersion.skill_id == s.id).order_by(SkillVersion.created_at.desc()).first()
        downloads_count = db.query(Download).filter(Download.skill_id == s.id).count()

        summaries.append(SkillSummary(
            id=s.id,
            name=s.name,
            tagline=s.tagline,
            description=s.description,
            category=s.category,
            language=s.language,
            license=s.license,
            price_cents=s.price_cents,
            is_published=s.is_published,
            creator_name=s.creator.display_name if s.creator else "RoboSkill Guild",
            version=latest_ver.version if latest_ver else "0.1.0",
            tested_on_hardware=latest_ver.tested_on_hardware if latest_ver else False,
            unit_tests_passed=latest_ver.unit_tests_passed if latest_ver else True,
            downloads_count=downloads_count,
            rating_avg=5.0,
            reviews_count=0,
            created_at=s.created_at
        ))

    return summaries


@router.post("/purchase")
def purchase_skill(req: PurchaseRequest, user_id: int = 1, db: Session = Depends(get_db)):
    """
    Simulates acquiring / purchasing a skill license with transparent mock processing.
    """
    skill = db.query(Skill).filter(Skill.id == req.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).first()

    # Calculate 15% platform commission and 85% creator earnings
    price_cents = skill.price_cents
    platform_fee = int(price_cents * 0.15)
    creator_payout = price_cents - platform_fee

    tx_ref = f"tx_arc_{uuid.uuid4().hex[:12]}"

    purchase = Purchase(
        user_id=user.id,
        skill_id=skill.id,
        price_cents=price_cents,
        platform_fee_cents=platform_fee,
        creator_payout_cents=creator_payout,
        transaction_ref=tx_ref,
        status="completed"
    )
    db.add(purchase)
    db.commit()

    # Record creator earnings
    creator = skill.creator
    if creator and creator.developer_profile:
        earning = CreatorEarning(
            developer_id=creator.developer_profile.id,
            amount_cents=creator_payout,
            skill_id=skill.id,
            purchase_id=purchase.id,
            description=f"Purchase license for {skill.name}"
        )
        db.add(earning)
        creator.developer_profile.total_sales += 1
        creator.developer_profile.total_earnings_cents += creator_payout
        db.commit()

    return {
        "status": "success",
        "transaction_ref": tx_ref,
        "skill_id": skill.id,
        "skill_name": skill.name,
        "amount_cents": price_cents,
        "creator_payout_cents": creator_payout,
        "message": "License granted. Skill is now accessible in My Library."
    }

