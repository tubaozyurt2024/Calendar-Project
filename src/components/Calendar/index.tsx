/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";

import FullCalendar from "@fullcalendar/react";

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

import type { EventInput } from "@fullcalendar/core/index.js";
import type { EventDropArg } from "@fullcalendar/core";

import "../profileCalendar.scss";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import { updateAssignmentSuccess } from "../../store/schedule/actions";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const dispatch = useDispatch();

  const [events, setEvents] = useState<EventInput[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(
    dayjs(schedule?.scheduleStartDate).toDate()
  );
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pairDates, setPairDates] = useState<Map<string, string>>(new Map()); // date -> color

  const getPlugins = () => {
    const plugins = [dayGridPlugin];

    plugins.push(interactionPlugin);
    return plugins;
  };

  const getShiftById = (id: string) => {
    return schedule?.shifts?.find((shift: { id: string }) => id === shift.id);
  };

  const getAssigmentById = (id: string) => {
    return schedule?.assignments?.find((assign) => id === assign.id);
  };

  const getStaffById = (id: string) => {
    return schedule?.staffs?.find((staff: any) => staff.id === id);
  };

  // Renk paleti - her shift ve staff kombinasyonu için benzersiz renk
  const colorPalette = [
    '#fcc729', '#ff8847', '#c0c033', '#32a852', '#32a8a2',
    '#327ba8', '#3244a8', '#5a32a8', '#a832a4', '#fffe88',
    '#c2068a', '#c28d06', '#a2c206', '#3bc206', '#108f7c',
    '#10278f', '#51108f', '#118f22', '#620878', '#40690a',
    '#81f4cf', '#09aa1d', '#60d3e1', '#8de149', '#74db6c',
    '#47216b', '#447804', '#933862', '#7ff932', '#2a7626',
    '#b6065f', '#52e6d3', '#c8b062', '#a749b7', '#c1e87c',
    '#13249d', '#01c40b', '#2e6332', '#70ae19', '#b3524c'
  ];

  // Staff bazlı renk belirleme fonksiyonu (pair renklendirmesi için)
  const getStaffColor = (staffId: string): string => {
    if (!schedule?.staffs) {
      return colorPalette[0];
    }
    const staffIndex = schedule.staffs.findIndex((s: any) => s.id === staffId);
    if (staffIndex === -1) {
      return colorPalette[0];
    }
    // Her staff için sabit bir renk (staff index'e göre)
    return colorPalette[staffIndex % colorPalette.length];
  };

  // Shift ve staff bazlı benzersiz renk oluşturma fonksiyonu
  const getEventColor = (shiftId: string, staffId: string): { className: string; backgroundColor: string } => {
    if (!schedule?.shifts || !schedule?.staffs) {
      return { className: 'bg-one', backgroundColor: colorPalette[0] };
    }

    // Shift ve staff index'lerini bul
    const shiftIndex = schedule.shifts.findIndex((s: any) => s.id === shiftId);
    const staffIndex = schedule.staffs.findIndex((s: any) => s.id === staffId);
    
    // Eğer bulunamazsa varsayılan değer
    if (shiftIndex === -1 || staffIndex === -1) {
      return { className: 'bg-one', backgroundColor: colorPalette[0] };
    }
    
    // Her shift için farklı renk grubu, her staff için farklı ton
    // Shift index * staff sayısı + staff index ile benzersiz kombinasyon
    const colorIndex = (shiftIndex * schedule.staffs.length + staffIndex) % colorPalette.length;
    const backgroundColor = colorPalette[colorIndex];
    
    // CSS sınıfı için sayıyı kelimeye çevir
    const colorNumber = colorIndex + 1;
    const numberWords: { [key: number]: string } = {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
      6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
      11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
      16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
      21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
      26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
      31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
      36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty'
    };
    
    const className = `bg-${numberWords[colorNumber] || 'one'}`;
    
    return { className, backgroundColor };
  };

  const validDates = () => {
    const dates = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    while (
      currentDate.isBefore(schedule.scheduleEndDate) ||
      currentDate.isSame(schedule.scheduleEndDate)
    ) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  };

  const getDatesBetween = (startDate: string, endDate: string) => {
    const dates = [];
    const start = dayjs(startDate, "DD.MM.YYYY").toDate();
    const end = dayjs(endDate, "DD.MM.YYYY").toDate();
    const current = new Date(start);

    while (current <= end) {
      dates.push(dayjs(current).format("DD-MM-YYYY"));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const generateStaffBasedCalendar = () => {
    // Seçili staff yoksa event oluşturma
    if (!selectedStaffId || !schedule?.assignments) {
      setEvents([]);
      return;
    }

    const works: EventInput[] = [];

    // Seçili staff'a ait assignment'ları filtrele
    const filteredAssignments = schedule.assignments.filter(
      (assign) => assign.staffId === selectedStaffId
    );

    for (let i = 0; i < filteredAssignments.length; i++) {
      const assignment = filteredAssignments[i];
      const shift = getShiftById(assignment.shiftId);
      
      if (!shift) continue;

      // Event tarihini ve saatlerini doğru formatla
      const eventStart = dayjs.utc(assignment.shiftStart).toDate();
      const eventEnd = dayjs.utc(assignment.shiftEnd).toDate();
      const assignmentDate = dayjs.utc(assignment.shiftStart).format("YYYY-MM-DD");
      
      const isValidDate = validDates().includes(assignmentDate);

      // Renk bilgisini oluştur (shift ve staff bazlı)
      const { className: colorClass, backgroundColor } = getEventColor(assignment.shiftId, assignment.staffId);

      const work: EventInput = {
        id: assignment.id,
        title: shift.name || "Unknown Shift",
        start: eventStart,
        end: eventEnd,
        allDay: false,
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: colorClass === 'bg-ten' ? '#000000' : '#ffffff',
        extendedProps: {
          staffId: assignment.staffId,
          shiftId: assignment.shiftId,
          assignmentId: assignment.id,
          shiftStart: assignment.shiftStart,
          shiftEnd: assignment.shiftEnd,
          isUpdated: assignment.isUpdated || false,
        },
        className: `event ${colorClass} ${
          assignment.isUpdated ? "highlight" : ""
        } ${!isValidDate ? "invalid-date" : ""}`,
      };
      works.push(work);
    }

    // Off days için highlighted dates
    const selectedStaff = schedule.staffs?.find(
      (staff: any) => staff.id === selectedStaffId
    );
    const offDays = selectedStaff?.offDays || [];
    const dates = getDatesBetween(
      dayjs(schedule.scheduleStartDate).format("DD.MM.YYYY"),
      dayjs(schedule.scheduleEndDate).format("DD.MM.YYYY")
    );
    let highlightedDatesList: string[] = [];

    dates.forEach((date) => {
      const transformedDate = dayjs(date, "DD-MM-YYYY").format("DD.MM.YYYY");
      if (offDays.includes(transformedDate)) highlightedDatesList.push(date);
    });

    // Pair günlerini hesapla ve renklerini belirle
    const pairDatesMap = new Map<string, string>();
    if (selectedStaff?.pairList && selectedStaff.pairList.length > 0) {
      selectedStaff.pairList.forEach((pair: any) => {
        const pairStaff = schedule.staffs?.find((s: any) => s.id === pair.staffId);
        if (pairStaff) {
          // Pair'deki diğer staff'ın rengini al
          const pairColor = getStaffColor(pair.staffId);
          
          // Pair tarih aralığındaki tüm günleri işaretle
          const pairStartDate = dayjs(pair.startDate, "DD.MM.YYYY");
          const pairEndDate = dayjs(pair.endDate, "DD.MM.YYYY");
          let currentPairDate = pairStartDate;
          
          while (currentPairDate.isSameOrBefore(pairEndDate)) {
            const dateKey = currentPairDate.format("YYYY-MM-DD");
            pairDatesMap.set(dateKey, pairColor);
            currentPairDate = currentPairDate.add(1, "day");
          }
        }
      });
    }
    
    setPairDates(pairDatesMap);
    setHighlightedDates(highlightedDatesList);
    setEvents(works);
  };

  useEffect(() => {
    if (schedule?.staffs && schedule.staffs.length > 0) {
      const firstStaffId = schedule.staffs[0].id;
      if (!selectedStaffId) {
        setSelectedStaffId(firstStaffId);
      }
    }
  }, [schedule]);

  useEffect(() => {
    if (selectedStaffId && schedule) {
      generateStaffBasedCalendar();
    }
  }, [selectedStaffId, schedule]);

  const RenderEventContent = ({ eventInfo }: any) => {
    return (
      <div className="event-content">
        <p>{eventInfo.event.title}</p>
      </div>
    );
  };

  // Event tıklandığında modal aç
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    const assignment = getAssigmentById(event.id);
    const shift = getShiftById(event.extendedProps.shiftId);
    const staff = getStaffById(event.extendedProps.staffId);

    if (assignment && shift && staff) {
      setSelectedEvent({
        assignment,
        shift,
        staff,
        eventStart: event.start,
        eventEnd: event.end,
      });
      setIsModalOpen(true);
    }
  };

  // Modal'ı kapat
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Event sürükle-bırak işlemi
  const handleEventDrop = (dropInfo: EventDropArg) => {
    const event = dropInfo.event;
    const assignmentId = event.id;
    const newStart = dropInfo.event.start;

    if (!newStart || !assignmentId) {
      return;
    }

    // Mevcut assignment'ı bul
    const currentAssignment = schedule?.assignments?.find(
      (assign) => assign.id === assignmentId
    );

    if (!currentAssignment) {
      return;
    }

    // Eski süreyi hesapla (saat cinsinden)
    const oldStart = dayjs.utc(currentAssignment.shiftStart);
    const oldEnd = dayjs.utc(currentAssignment.shiftEnd);
    const durationHours = oldEnd.diff(oldStart, 'hour', true);

    // Yeni başlangıç zamanını UTC formatına çevir
    const newShiftStart = dayjs(newStart).utc().toISOString();
    
    // Yeni bitiş zamanını hesapla (eski süreyi koruyarak)
    const newShiftEnd = dayjs(newStart)
      .add(durationHours, 'hour')
      .utc()
      .toISOString();

    // Redux store'u güncelle
    dispatch(updateAssignmentSuccess({
      assignmentId,
      newShiftStart,
      newShiftEnd,
    }) as any);

    // Başarı mesajı göster
    showToast('Event başarıyla güncellendi!', 'success');
  };

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="calendar-section">
      <div className="calendar-wrapper">
        <div className="staff-list">
          {schedule?.staffs?.map((staff: any) => (
            <div
              key={staff.id}
              onClick={() => setSelectedStaffId(staff.id)}
              className={`staff ${
                staff.id === selectedStaffId ? "active" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
              >
                <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z" />
              </svg>
              <span>{staff.name}</span>
            </div>
          ))}
        </div>
        <FullCalendar
          ref={calendarRef}
          locale={auth.language}
          plugins={getPlugins()}
          contentHeight="auto"
          height="auto"
          handleWindowResize={true}
          selectable={true}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          firstDay={1}
          dayMaxEventRows={4}
          fixedWeekCount={false}
          showNonCurrentDates={true}
          aspectRatio={1.8}
          eventContent={(eventInfo: any) => (
            <RenderEventContent eventInfo={eventInfo} />
          )}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          datesSet={(info: any) => {
            const prevButton = document.querySelector(
              ".fc-prev-button"
            ) as HTMLButtonElement;
            const nextButton = document.querySelector(
              ".fc-next-button"
            ) as HTMLButtonElement;

            if (
              calendarRef?.current?.getApi().getDate() &&
              !dayjs(schedule?.scheduleStartDate).isSame(
                calendarRef?.current?.getApi().getDate()
              )
            )
              setInitialDate(calendarRef?.current?.getApi().getDate());

            const startDiff = dayjs(info.start)
              .utc()
              .diff(
                dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(),
                "days"
              );
            const endDiff = dayjs(dayjs(schedule.scheduleEndDate)).diff(
              info.end,
              "days"
            );
            if (startDiff < 0 && startDiff > -35) prevButton.disabled = true;
            else prevButton.disabled = false;

            if (endDiff < 0 && endDiff > -32) nextButton.disabled = true;
            else nextButton.disabled = false;
          }}
          dayCellContent={({ date }) => {
            const dateKey = dayjs(date).format("YYYY-MM-DD");
            const found = validDates().includes(dateKey);
            const isHighlighted = highlightedDates.includes(
              dayjs(date).format("DD-MM-YYYY")
            );
            
            // Pair günü kontrolü
            const isPairDay = pairDates.has(dateKey);
            const pairColor = isPairDay ? pairDates.get(dateKey) : null;

            return (
              <div
                className={`${found ? "" : "date-range-disabled"} ${
                  isHighlighted ? "highlighted-date-orange" : ""
                } ${isPairDay ? "highlightedPair" : ""}`}
                style={isPairDay && pairColor ? {
                  borderBottom: `5px solid ${pairColor}`,
                  opacity: 0.8
                } : {}}
                data-pair-color={pairColor || undefined}
              >
                {dayjs(date).date()}
              </div>
            );
          }}
        />
      </div>

      {/* Event Detay Modal */}
      {isModalOpen && selectedEvent && (
        <div className="event-modal-overlay" onClick={closeModal}>
          <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3>Event Detayları</h3>
              <button className="event-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="event-modal-body">
              <div className="event-detail-row">
                <span className="event-detail-label">Personel Adı:</span>
                <span className="event-detail-value">{selectedEvent.staff.name}</span>
              </div>
              <div className="event-detail-row">
                <span className="event-detail-label">Vardiya Adı:</span>
                <span className="event-detail-value">{selectedEvent.shift.name}</span>
              </div>
              <div className="event-detail-row">
                <span className="event-detail-label">Tarih:</span>
                <span className="event-detail-value">
                  {dayjs(selectedEvent.eventStart).format("DD.MM.YYYY")}
                </span>
              </div>
              <div className="event-detail-row">
                <span className="event-detail-label">Başlangıç Saati:</span>
                <span className="event-detail-value">
                  {dayjs(selectedEvent.eventStart).format("HH:mm")}
                </span>
              </div>
              <div className="event-detail-row">
                <span className="event-detail-label">Bitiş Saati:</span>
                <span className="event-detail-value">
                  {dayjs(selectedEvent.eventEnd).format("HH:mm")}
                </span>
              </div>
              {selectedEvent.assignment.isUpdated && (
                <div className="event-detail-row">
                  <span className="event-detail-label">Durum:</span>
                  <span className="event-detail-value updated">Güncellenmiş</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                className="toast-icon"
              >
                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarContainer;
