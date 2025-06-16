import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Google Calendar configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/auth/google/callback`;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google Calendar integration disabled: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
} else {
  console.log('Google Calendar integration enabled');
  console.log('Redirect URI:', GOOGLE_REDIRECT_URI);
}

// OAuth2 client setup
export const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Calendar API setup
export const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Generate authorization URL
export function getAuthUrl(userId: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId, // Pass user ID to identify the user after OAuth
    prompt: 'consent'
  });
}

// Set credentials from stored tokens
export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

// Get user's calendar events
export async function getCalendarEvents(
  calendarId: string = 'primary',
  timeMin: string,
  timeMax: string
) {
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

// Create calendar event
export async function createCalendarEvent(eventData: {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees: { email: string; displayName?: string }[];
  calendarId?: string;
}) {
  try {
    const response = await calendar.events.insert({
      calendarId: eventData.calendarId || 'primary',
      sendUpdates: 'all',
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees,
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      },
      conferenceDataVersion: 1
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Get available time slots
export async function getAvailableSlots(
  calendarId: string,
  startDate: string,
  endDate: string,
  duration: number = 30 // Duration in minutes
) {
  try {
    const events = await getCalendarEvents(calendarId, startDate, endDate);
    
    // Convert events to busy times
    const busyTimes = events
      .filter(event => event.start?.dateTime && event.end?.dateTime)
      .map(event => ({
        start: new Date(event.start!.dateTime!),
        end: new Date(event.end!.dateTime!)
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Generate available slots
    const availableSlots = [];
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    const slotDuration = duration * 60 * 1000; // Convert to milliseconds

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      // Skip weekends
      if (day.getDay() === 0 || day.getDay() === 6) continue;

      // Generate slots for the day
      const dayStart = new Date(day);
      dayStart.setHours(workingHours.start, 0, 0, 0);
      
      const dayEnd = new Date(day);
      dayEnd.setHours(workingHours.end, 0, 0, 0);

      for (let slotStart = new Date(dayStart); slotStart < dayEnd; slotStart.setTime(slotStart.getTime() + slotDuration)) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration);
        
        // Check if slot conflicts with any busy time
        const isAvailable = !busyTimes.some(busy => 
          (slotStart >= busy.start && slotStart < busy.end) ||
          (slotEnd > busy.start && slotEnd <= busy.end) ||
          (slotStart <= busy.start && slotEnd >= busy.end)
        );

        if (isAvailable && slotEnd <= dayEnd) {
          availableSlots.push({
            start: new Date(slotStart),
            end: new Date(slotEnd),
            duration
          });
        }
      }
    }

    return availableSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
}

// Update calendar event
export async function updateCalendarEvent(
  eventId: string,
  eventData: any,
  calendarId: string = 'primary'
) {
  try {
    const response = await calendar.events.update({
      calendarId,
      eventId,
      sendUpdates: 'all',
      requestBody: eventData
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

// Delete calendar event
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
) {
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all'
    });

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}