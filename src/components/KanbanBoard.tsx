import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadStatus, LeadStatusBadge } from "./LeadStatusBadge";
import { Phone, Mail, MapPin, DollarSign, User } from "lucide-react";
import { useRef, useEffect } from "react";

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  lead_status: LeadStatus;
  owner_name?: string;
  owner_phone?: string;
}

interface KanbanBoardProps {
  properties: Property[];
  onStatusChange: (propertyId: string, newStatus: LeadStatus) => void;
  onPropertyClick?: (property: Property) => void;
}

const columns: { id: LeadStatus; title: string; color: string }[] = [
  { id: "new", title: "New", color: "bg-blue-500" },
  { id: "contacted", title: "Contacted", color: "bg-purple-500" },
  { id: "following_up", title: "Following Up", color: "bg-yellow-500" },
  { id: "meeting_scheduled", title: "Meeting", color: "bg-orange-500" },
  { id: "offer_made", title: "Offer Made", color: "bg-indigo-500" },
  { id: "closed", title: "Closed", color: "bg-green-500" },
  { id: "not_interested", title: "Not Interested", color: "bg-gray-500" },
];

export const KanbanBoard = ({ properties, onStatusChange, onPropertyClick }: KanbanBoardProps) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStatus = destination.droppableId as LeadStatus;
    onStatusChange(draggableId, newStatus);
  };

  const getPropertiesByStatus = (status: LeadStatus) => {
    return properties.filter((p) => p.lead_status === status);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const topScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const topScroll = topScrollRef.current;
    const contentScroll = contentScrollRef.current;

    if (!topScroll || !contentScroll) return;

    const syncTopToContent = () => {
      if (contentScroll) contentScroll.scrollLeft = topScroll.scrollLeft;
    };

    const syncContentToTop = () => {
      if (topScroll) topScroll.scrollLeft = contentScroll.scrollLeft;
    };

    topScroll.addEventListener("scroll", syncTopToContent);
    contentScroll.addEventListener("scroll", syncContentToTop);

    return () => {
      topScroll.removeEventListener("scroll", syncTopToContent);
      contentScroll.removeEventListener("scroll", syncContentToTop);
    };
  }, []);

  const totalWidth = columns.length * 288 + (columns.length - 1) * 16; // 72 * 4 = 288px per column + 16px gap

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Top scroll bar */}
      <div
        ref={topScrollRef}
        className="overflow-x-auto overflow-y-hidden mb-2"
        style={{ height: "16px" }}
      >
        <div style={{ width: `${totalWidth}px`, height: "1px" }} />
      </div>
      
      <div
        ref={contentScrollRef}
        className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]"
      >
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-72">
            <div className={`${column.color} rounded-t-lg px-3 py-2`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {getPropertiesByStatus(column.id).length}
                </Badge>
              </div>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-muted/50 rounded-b-lg p-2 min-h-[500px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-muted" : ""
                  }`}
                >
                  {getPropertiesByStatus(column.id).map((property, index) => (
                    <Draggable key={property.id} draggableId={property.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? "shadow-lg rotate-2" : ""
                          }`}
                          onClick={() => onPropertyClick?.(property)}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm leading-tight">{property.address}</p>
                                <p className="text-xs text-muted-foreground">
                                  {property.city}, {property.state} {property.zip_code}
                                </p>
                              </div>
                            </div>

                            {property.owner_name && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{property.owner_name}</span>
                              </div>
                            )}

                            {property.owner_phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{property.owner_phone}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                              <div className="flex items-center gap-1 text-xs">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(property.cash_offer_amount)}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Est: {formatCurrency(property.estimated_value)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
