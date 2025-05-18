import fs from "fs/promises";
import path from "path";
import { DesignSite, SavedImage } from "../types.js";

// Configuration
export const CONFIG = {
  dataDir: path.join(process.cwd(), "design-data"),
  imagesDir: path.join(process.cwd(), "design-data", "images"),
  collectionFile: path.join(process.cwd(), "design-data", "collection.json"),
};

// Initialize data storage
export async function initializeStorage(): Promise<void> {
  try {
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.mkdir(CONFIG.imagesDir, { recursive: true });
    
    try {
      await fs.access(CONFIG.collectionFile);
    } catch {
      // Create empty collection file if it doesn't exist
      await fs.writeFile(CONFIG.collectionFile, JSON.stringify({ images: [] }));
    }
    
    console.error("Storage initialized successfully");
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    throw error;
  }
}

// Get the collection of saved designs
export async function getCollection(): Promise<{ images: SavedImage[] }> {
  try {
    const data = await fs.readFile(CONFIG.collectionFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading collection:", error);
    return { images: [] };
  }
}

// Save a design to the collection
export async function saveToCollection(image: SavedImage): Promise<void> {
  try {
    const collection = await getCollection();
    collection.images.push(image);
    await fs.writeFile(CONFIG.collectionFile, JSON.stringify(collection, null, 2));
  } catch (error) {
    console.error("Error saving to collection:", error);
    throw error;
  }
}

// Remove a design from the collection
export async function removeFromCollection(imageId: string): Promise<boolean> {
  try {
    const collection = await getCollection();
    const imageIndex = collection.images.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) return false;
    
    const removedImage = collection.images[imageIndex];
    collection.images.splice(imageIndex, 1);
    
    // Remove the image file
    try {
      await fs.unlink(removedImage.localPath);
    } catch (err) {
      console.error("Failed to delete image file:", err);
    }
    
    await fs.writeFile(CONFIG.collectionFile, JSON.stringify(collection, null, 2));
    return true;
  } catch (error) {
    console.error("Error removing from collection:", error);
    return false;
  }
}