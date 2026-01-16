import { Router } from "express";
import prisma from "../prisma/client";
import { serializeBigInt } from "../utils/serializeBigInt";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authRoles";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/eventServices";

const router = Router();

// GET /event
router.get("/", async (req, res) => {
  console.log("GET /events called");

  try {
    const events = await prisma.event.findMany();
    res.json(serializeBigInt(events));
  } catch (error: any) {
    console.error("Error in getAllEvents: ", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /event/:id
router.get("/:id", async (req, res) => {
  console.log("GET /events/:id called");

  try {
    const event_id = BigInt(req.params.id); // convert from string to bigint
    const event = await getEventById(event_id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error: any) {
    console.error("Error in getEventById: ", error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE /event
router.post("/", authenticateToken, authorizeRoles(['Admin']), async (req, res) => {
  console.log("CREATE /events called");

  try {
    const { event_name, event_date, pillar, proposal_id, admin_id } = req.body;

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { proposal_id: BigInt(proposal_id) },
    });

    if (!proposal) {
      return res.status(400).json({
        message: `Proposal with ID ${proposal_id} does not exist.`,
      });
    }

    // Create event
    const newEvent = await createEvent({
      event_name,
      event_date: new Date(event_date),
      pillar,
      proposal_id: BigInt(proposal_id),
      admin_id: BigInt(admin_id),
    });

    console.log("Created Event:", newEvent);
    res.status(201).json(serializeBigInt(newEvent));

  } catch (error: any) {
    console.error("Error in createEvent:", error);
    res.status(500).json({ message: error.message });
  }
});


// PUT /event/:id
router.put("/:id", async (req, res) => {
  console.log("PUT /events called");
  try {
    const event_id = BigInt(req.params.id);

    // Check if the event exists
    const existingEvent = await prisma.event.findUnique({
      where: { event_id },
    });
    
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { event_name, event_date, pillar, proposal_id, admin_id } = req.body;

    const updatedEvent = await updateEvent(event_id, {
      event_name,
      event_date,
      pillar,
      proposal_id,
      admin_id,
    });

    console.log("Updated event: ", updatedEvent);
    res.status(200).json(serializeBigInt(updatedEvent));
  } catch (error: any) {
    console.error("Error in updateEvent: ", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE event
router.delete("/:id", async (req, res) => {
  console.log("DELETE /events/:id called");

  try {
    const event_id = BigInt(req.params.id);
    const deletedEvent = await deleteEvent(event_id);

    console.log("Deleted Event: ", deletedEvent);
    res.status(200).json(serializeBigInt(deletedEvent));
  } catch (error: any) {
    console.error("Error in deleteEvent: ", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
