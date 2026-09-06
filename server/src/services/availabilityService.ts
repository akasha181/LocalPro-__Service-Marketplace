import { Booking } from '../models/Booking';
import { Availability } from '../models/Availability';
import { Types } from 'mongoose';

export interface CalculatedSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const checkSlotConflict = async (
  professionalId: string | Types.ObjectId,
  startDateTime: Date,
  endDateTime: Date
): Promise<boolean> => {
  const conflictingBooking = await Booking.findOne({
    professionalId,
    status: { $in: ['PENDING', 'CONFIRMED'] },
    startDateTime: { $lt: endDateTime },
    endDateTime: { $gt: startDateTime },
  });

  return !!conflictingBooking;
};

export const getAvailableSlotsForDate = async (
  professionalId: string,
  dateStr: string
): Promise<CalculatedSlot[]> => {
  const targetDate = new Date(dateStr);
  const dayOfWeek = targetDate.getUTCDay();

  // Find professional availability or default Mon-Sat 09:00 - 18:00
  let availability = await Availability.findOne({ professionalId });

  let workingDay = availability?.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);

  // If no custom schedule, default Monday-Saturday working
  if (!workingDay) {
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 6;
    workingDay = {
      dayOfWeek,
      isWorking: isWeekday,
      slots: isWeekday ? [{ startTime: '09:00', endTime: '18:00' }] : [],
    };
  }

  if (!workingDay.isWorking) {
    return [];
  }

  // Check blackout dates
  if (availability?.blackoutDates?.length) {
    const isBlackout = availability.blackoutDates.some(
      (bDate) => bDate.toISOString().split('T')[0] === dateStr
    );
    if (isBlackout) return [];
  }

  // Generate standard 1-hour slots
  const slots: CalculatedSlot[] = [];
  for (const slotRange of workingDay.slots) {
    const [startHour] = slotRange.startTime.split(':').map(Number);
    const [endHour] = slotRange.endTime.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      const sHour = hour.toString().padStart(2, '0');
      const eHour = (hour + 1).toString().padStart(2, '0');
      const startTime = `${sHour}:00`;
      const endTime = `${eHour}:00`;

      // Construct UTC Date objects for this date & slot
      const startDateTime = new Date(`${dateStr}T${startTime}:00.000Z`);
      const endDateTime = new Date(`${dateStr}T${endTime}:00.000Z`);

      const hasConflict = await checkSlotConflict(professionalId, startDateTime, endDateTime);

      slots.push({
        startTime,
        endTime,
        isAvailable: !hasConflict,
      });
    }
  }

  return slots;
};
