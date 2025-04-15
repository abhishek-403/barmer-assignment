import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { colorsPalette } from "../contants";
import { Waypoint } from "../types";

const WaypointList = ({
  waypoints,
  setWaypoints,
  selectedWaypoint,
  setSelectedWaypoint,
  moveWaypointUp,
  moveWaypointDown,
  deleteWaypoint,
}: {
  waypoints: Waypoint[];
  selectedWaypoint: Waypoint | null;
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;
  setSelectedWaypoint: React.Dispatch<React.SetStateAction<Waypoint | null>>;
  moveWaypointUp: (id: string) => void;
  moveWaypointDown: (id: string) => void;
  deleteWaypoint: (id: string) => void;
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = waypoints.findIndex((w) => w.id === active.id);
      const newIndex = waypoints.findIndex((w) => w.id === over.id);
      const newWaypoints = arrayMove(waypoints, oldIndex, newIndex).map(
        (wp, idx) => ({
          ...wp,
          sequence: idx + 1,
        })
      );

      setWaypoints(newWaypoints);
    }
  };

  if (waypoints.length === 0) {
    return (
      <div className=" text-center p-4 bg-gray-200 rounded text-gray-500">
        No waypoints added. Click on the map to add waypoints.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={waypoints.map((wp) => wp.id)}
        strategy={verticalListSortingStrategy}
      >
        {waypoints
          .sort((a, b) => a.sequence - b.sequence)
          .map((waypoint) => (
            <SortableWaypointItem
              key={waypoint.id}
              waypoint={waypoint}
              selectedWaypoint={selectedWaypoint}
              setSelectedWaypoint={setSelectedWaypoint}
              moveWaypointUp={moveWaypointUp}
              moveWaypointDown={moveWaypointDown}
              deleteWaypoint={deleteWaypoint}
              waypoints={waypoints}
            />
          ))}
      </SortableContext>
    </DndContext>
  );
};

function SortableWaypointItem({
  waypoint,
  selectedWaypoint,
  setSelectedWaypoint,
  deleteWaypoint,
}: {
  waypoint: Waypoint;
  waypoints: Waypoint[];
  selectedWaypoint: Waypoint | null;
  setSelectedWaypoint: React.Dispatch<React.SetStateAction<Waypoint | null>>;
  moveWaypointUp: (id: string) => void;
  moveWaypointDown: (id: string) => void;
  deleteWaypoint: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: waypoint.id });

  const style = {
    backgroundColor:
      colorsPalette[Number(waypoint.id) % colorsPalette.length].light,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 select-none border border-neutral-400 rounded shadow flex items-center mb-2 ${
        selectedWaypoint?.id === waypoint.id ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <div
        className="flex cursor-grab w-full items-center justify-center"
        {...attributes}
        {...listeners}
      >
        {/* Sequence number */}
        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
          {waypoint.sequence}
        </div>

        <div className="flex-1">
          <div className="text-sm truncate">
            Lat: {waypoint.latitude.toFixed(6)}
          </div>
          <div className="text-sm truncate">
            Lng: {waypoint.longitude.toFixed(6)}
          </div>
          <div className="text-xs text-gray-500">
            Alt: {waypoint.altitude.toFixed(2)}m
          </div>
        </div>
      </div>

      <div className="flex transition-all items-center ml-auto justify-center">
        <div className="flex ml-auto flex-col space-y-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedWaypoint(waypoint);
            }}
            className="p-1 text-blue-600 rounded hover:bg-blue-100"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteWaypoint(waypoint.id);
            }}
            className="p-1 text-red-600 rounded hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default WaypointList;
