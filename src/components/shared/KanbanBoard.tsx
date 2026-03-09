import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LeadStatus } from "../lead/LeadStatusBadge";
import { Phone, MapPin, DollarSign, User } from "lucide-react";
import { useRef, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  selectedProperties?: string[];
  onSelectionChange?: (propertyId: string) => void;
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

export const KanbanBoard = ({ 
  properties, 
  onStatusChange, 
  onPropertyClick,
  selectedProperties = [],
  onSelectionChange
}: KanbanBoardProps) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as LeadStatus;
    onStatusChange(draggableId, newStatus);
  };

  const propertiesByStatus = useMemo(() => {
    const map = new Map<LeadStatus, Property[]>();
    columns.forEach(col => map.set(col.id, []));
    properties.forEach(p => {
      const arr = map.get(p.lead_status) || [];
      arr.push(p);
      map.set(p.lead_status, arr);
    });
    return map;
  }, [properties]);

  // Pipeline summary
  const totalValue = useMemo(() => 
    properties.reduce((sum, p) => sum + (p.cash_offer_amount || 0), 0), 
    [properties]
  );

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

  const totalWidth = columns.length * 288 + (columns.length - 1) * 16;

  const handleCheckboxClick = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    onSelectionChange?.(propertyId);
  };

  return (
    <div className="space-y-4">
      {/* Pipeline Summary */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-card rounded-lg border"
      >
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Total Pipeline</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
        </div>
        <div className="flex gap-2">
          {columns.slice(0, 4).map(col => {
            const count = propertiesByStatus.get(col.id)?.length || 0;
            return (
              <div key={col.id} className="text-center px-3">
                <div className={`h-2 w-2 rounded-full ${col.color} mx-auto mb-1`} />
                <p className="text-lg font-semibold">{count}</p>
                <p className="text-xs text-muted-foreground">{col.title}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

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
          className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-350px)]"
        >
          {columns.map((column, colIndex) => {
            const columnProperties = propertiesByStatus.get(column.id) || [];
            const columnValue = columnProperties.reduce((sum, p) => sum + (p.cash_offer_amount || 0), 0);
            
            return (
              <motion.div 
                key={column.id} 
                className="flex-shrink-0 w-72"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: colIndex * 0.05 }}
              >
                <div className={`${column.color} rounded-t-lg px-3 py-2`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {columnProperties.length}
                    </Badge>
                  </div>
                  <p className="text-white/80 text-xs mt-0.5">{formatCurrency(columnValue)}</p>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-muted/50 rounded-b-lg p-2 min-h-[450px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/10 ring-2 ring-primary/30" : ""
                      }`}
                    >
                      <AnimatePresence mode="popLayout">
                        {columnProperties.map((property, index) => {
                          const isSelected = selectedProperties.includes(property.id);
                          return (
                            <Draggable key={property.id} draggableId={property.id} index={index}>
                              {(provided, snapshot) => (
                                <motion.div
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                                      snapshot.isDragging ? "shadow-lg rotate-2 scale-105" : ""
                                    } ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
                                    onClick={() => onPropertyClick?.(property)}
                                  >
                                    <CardContent className="p-3 space-y-2">
                                      <div className="flex items-start gap-2">
                                        {onSelectionChange && (
                                          <div onClick={(e) => handleCheckboxClick(e, property.id)}>
                                            <Checkbox
                                              checked={isSelected}
                                              className="mt-0.5"
                                            />
                                          </div>
                                        )}
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm leading-tight truncate">{property.address}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {property.city}, {property.state} {property.zip_code}
                                          </p>
                                        </div>
                                      </div>

                                      {property.owner_name && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <User className="h-3 w-3" />
                                          <span className="truncate">{property.owner_name}</span>
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
                                </motion.div>
                              )}
                            </Draggable>
                          );
                        })}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </motion.div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
