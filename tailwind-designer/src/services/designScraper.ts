import puppeteer from "puppeteer";
import { DesignSite, DesignSearchResponse, DesignSearchResult } from "../types.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { CONFIG } from "../utils/storage.js";

/**
 * Search for designs on a specific design site
 */
export async function searchDesigns(
  site: DesignSite, 
  query: string, 
  limit: number
): Promise<DesignSearchResponse> {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    let searchUrl = "";
    let results: DesignSearchResult[] = [];
    
    // Configure search URL based on the selected site
    switch (site) {
      case "dribbble":
        searchUrl = `https://dribbble.com/search/${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        
        results = await page.evaluate((resultLimit) => {
          const shots = Array.from(document.querySelectorAll('.shot-thumbnail'));
          return shots.slice(0, resultLimit).map(shot => {
            const link = shot.querySelector('a');
            const img = shot.querySelector('img');
            const title = shot.querySelector('.shot-title') || shot.querySelector('a');
            
            return {
              title: title ? title.textContent?.trim() || 'Untitled Design' : 'Untitled Design',
              thumbnailUrl: img ? img.getAttribute('src') || img.getAttribute('data-src') : null,
              pageUrl: link ? new URL(link.getAttribute('href') || '', 'https://dribbble.com').href : null
            };
          }).filter(item => item.thumbnailUrl && item.pageUrl);
        }, limit);
        break;
        
      case "behance":
        searchUrl = `https://www.behance.net/search?search=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        
        results = await page.evaluate((resultLimit) => {
          const projects = Array.from(document.querySelectorAll('.ProjectCoverNeue-root-166'));
          return projects.slice(0, resultLimit).map(project => {
            const link = project.querySelector('a');
            const img = project.querySelector('img');
            const title = project.querySelector('.ProjectCoverNeue-title-VNP');
            
            return {
              title: title ? title.textContent?.trim() || 'Untitled Project' : 'Untitled Project',
              thumbnailUrl: img ? img.getAttribute('src') || img.getAttribute('data-src') : null,
              pageUrl: link ? new URL(link.getAttribute('href') || '', 'https://behance.net').href : null
            };
          }).filter(item => item.thumbnailUrl && item.pageUrl);
        }, limit);
        break;
        
      case "siteinspire":
        searchUrl = `https://www.siteinspire.com/search?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        
        results = await page.evaluate((resultLimit) => {
          const sites = Array.from(document.querySelectorAll('.site'));
          return sites.slice(0, resultLimit).map(site => {
            const link = site.querySelector('a');
            const img = site.querySelector('img');
            const title = site.querySelector('.title');
            
            return {
              title: title ? title.textContent?.trim() || 'Untitled Site' : 'Untitled Site',
              thumbnailUrl: img ? img.getAttribute('src') || img.getAttribute('data-src') : null,
              pageUrl: link ? new URL(link.getAttribute('href') || '', 'https://siteinspire.com').href : null
            };
          }).filter(item => item.thumbnailUrl && item.pageUrl);
        }, limit);
        break;
    }
    
    await browser.close();
    
    return {
      site,
      query,
      resultsCount: results.length,
      results
    };
  } catch (error) {
    console.error(`Error searching designs on ${site}:`, error);
    throw error;
  }
}

/**
 * Get trending designs from a design site
 */
export async function getTrendingDesigns(
  site: DesignSite, 
  limit: number
): Promise<DesignSearchResponse> {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    let siteUrl = "";
    let results: DesignSearchResult[] = [];
    
    switch (site) {
      case "dribbble":
        siteUrl = "https://dribbble.com/";
        await page.goto(siteUrl, { waitUntil: 'networkidle2' });
        
        results = await page.evaluate((resultLimit) => {
          const shots = Array.from(document.querySelectorAll('.shot-thumbnail'));
          return shots.slice(0, resultLimit).map(shot => {
            const link = shot.querySelector('a');
            const img = shot.querySelector('img');
            const title = shot.querySelector('.shot-title') || shot.querySelector('a');
            
            return {
              title: title ? title.textContent?.trim() || 'Untitled Design' : 'Untitled Design',
              thumbnailUrl: img ? img.getAttribute('src') || img.getAttribute('data-src') : null,
              pageUrl: link ? new URL(link.getAttribute('href') || '', 'https://dribbble.com').href : null
            };
          }).filter(item => item.thumbnailUrl && item.pageUrl);
        }, limit);
        break;
        
      case "behance":
        siteUrl = "https://www.behance.net/";
        await page.goto(siteUrl, { waitUntil: 'networkidle2' });
        
        results = await page.evaluate((resultLimit) => {
          const projects = Array.from(document.querySelectorAll('.ProjectCoverNeue-root-166'));
          return projects.slice(0, resultLimit).map(project => {
            const link = project.querySelector('a');
            const img = project.querySelector('img');
            const title = project.querySelector('.ProjectCoverNeue-title-VNP');
            
            return {
              title: title ? title.textContent?.trim() || 'Untitled Project' : 'Untitled Project',
              thumbnailUrl: img ? img.getAttribute('src') || img.getAttribute('data-src') : null,
              pageUrl: link ? new URL(link.getAttribute('href') || '', 'https://behance.net').href : null
            };
          }).filter(item => item.thumbnailUrl && item.pageUrl);
        }, limit);
        break;
        
      case "siteinspire":
        siteUrl = "https://www.siteinspire.com/";
        await page.goto(siteUrl, { waitUntil: 'networkidle2' });
        
        results = await page.evaluate((resultLimit) => {
          const sites = Array.from(document.querySelectorAll('.site'));
          return sites.slice(0, resultLimit).map(site => {
            const link = site.querySelector('a');
            const img = site.querySelector('img');
            const title = site.querySelector('.title');
            
            return {
              title: title ? title.textContent?.trim() || 'Untitled Site' : 'Untitled Site',
              thumbnailUrl: img ? img.getAttribute('src') || img.getAttribute('data-src') : null,
              pageUrl: link ? new URL(link.getAttribute('href') || '', 'https://siteinspire.com').href : null
            };
          }).filter(item => item.thumbnailUrl && item.pageUrl);
        }, limit);
        break;
    }
    
    await browser.close();
    
    return {
      site,
      resultsCount: results.length,
      results
    };
  } catch (error) {
    console.error(`Error fetching trending designs from ${site}:`, error);
    throw error;
  }
}

/**
 * Download an image from a URL
 */
export async function downloadImage(url: string): Promise<string> {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Get the image as buffer
    const imageBuffer = await page.goto(url).then(response => {
      if (!response) throw new Error("Failed to load image");
      return response.buffer();
    });
    
    // Create a unique filename
    const imageId = crypto.randomUUID();
    const imagePath = path.join(CONFIG.imagesDir, `${imageId}.png`);
    
    // Save the image
    await fs.writeFile(imagePath, imageBuffer);
    await browser.close();
    
    return imagePath;
  } catch (error) {
    console.error("Error downloading image:", error);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}