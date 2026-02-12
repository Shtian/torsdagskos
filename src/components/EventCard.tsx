import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui";

interface EventCardProps {
  id: number;
  title: string;
  dateTime: string;
  location: string;
  rsvpCounts: {
    going: number;
    maybe: number;
    notGoing: number;
  };
  isPast?: boolean;
}

export function EventCard({
  id,
  title,
  dateTime,
  location,
  rsvpCounts,
  isPast = false,
}: EventCardProps) {
  return (
    <a
      href={`/events/${id}`}
      data-test-id="event-card"
      className="block no-underline transition-all duration-200 hover:-translate-y-0.5"
      style={{ opacity: isPast ? 0.7 : 1 }}
    >
      <Card>
        <CardHeader>
          <h2 className="leading-none font-semibold m-0">{title}</h2>
          <CardDescription>{dateTime}</CardDescription>
          <CardDescription>{location}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" data-test-id="rsvp-going">
              {rsvpCounts.going} kommer
            </Badge>
            <Badge variant="secondary" data-test-id="rsvp-maybe">
              {rsvpCounts.maybe} kanskje
            </Badge>
            <Badge variant="outline" data-test-id="rsvp-not-going">
              {rsvpCounts.notGoing} kommer ikke
            </Badge>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
