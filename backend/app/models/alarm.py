import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.database import Base


class Alarm(Base):
    __tablename__ = "alarms"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    metric_id: Mapped[str] = mapped_column(String, nullable=False)
    operator: Mapped[str] = mapped_column(String, nullable=False)  # gt, gte, lt, lte, eq
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    check_interval: Mapped[int] = mapped_column(Integer, nullable=False, default=300)  # seconds
    slack_webhook: Mapped[str] = mapped_column(String, nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="ok")  # ok, triggered, error
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    events: Mapped[list["AlarmEvent"]] = relationship(
        back_populates="alarm", cascade="all, delete-orphan", order_by="AlarmEvent.sent_at.desc()"
    )


class AlarmEvent(Base):
    __tablename__ = "alarm_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alarm_id: Mapped[str] = mapped_column(String, ForeignKey("alarms.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)  # triggered, resolved, error
    metric_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    alarm: Mapped["Alarm"] = relationship(back_populates="events")
