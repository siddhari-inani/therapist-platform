"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TherapistLocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  zoom?: number;
}

// Global script loading state
let googleMapsScriptLoading = false;
let googleMapsScriptLoaded = false;

export function TherapistLocationMap({
  latitude,
  longitude,
  address,
  zoom = 15,
}: TherapistLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError("Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.");
      return;
    }

    // Check if Google Maps is already loaded and ready
    if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
      initializeMap();
      return;
    }

    // Check if script is already being loaded
    if (googleMapsScriptLoading) {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
          clearInterval(checkInterval);
          initializeMap();
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
      return () => clearInterval(checkInterval);
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    
    if (existingScript) {
      googleMapsScriptLoading = true;
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
          clearInterval(checkLoaded);
          googleMapsScriptLoaded = true;
          googleMapsScriptLoading = false;
          initializeMap();
        }
      }, 100);
      setTimeout(() => clearInterval(checkLoaded), 10000);
      return () => clearInterval(checkLoaded);
    }

    // Load Google Maps script
    googleMapsScriptLoading = true;
    const script = document.createElement("script");
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Wait for Google Maps to be fully initialized
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
          clearInterval(checkGoogle);
          googleMapsScriptLoaded = true;
          googleMapsScriptLoading = false;
          initializeMap();
        }
      }, 50);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google || !window.google.maps || typeof window.google.maps.Map !== 'function') {
          googleMapsScriptLoading = false;
          setMapError("Google Maps failed to initialize. Please check your API key and ensure Maps JavaScript API is enabled in Google Cloud Console.");
        }
      }, 10000);
    };
    
    script.onerror = () => {
      googleMapsScriptLoading = false;
      setMapError("Failed to load Google Maps. Please check your API key and ensure Maps JavaScript API is enabled in Google Cloud Console.");
    };
    
    document.head.appendChild(script);

    function initializeMap() {
      if (!mapRef.current) return;

      // Wait a bit to ensure everything is ready
      setTimeout(() => {
        if (!mapRef.current) return;

        if (!window.google || !window.google.maps || typeof window.google.maps.Map !== 'function') {
          setMapError("Google Maps failed to initialize. Please refresh the page or check your API key.");
          return;
        }

        try {
          // Clean up existing map if any
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setMap(null);
          }
          if (mapInstanceRef.current) {
            // Map will be replaced
          }

          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: latitude, lng: longitude },
            zoom: zoom,
            mapTypeControl: false,
            streetViewControl: true,
            fullscreenControl: true,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          });

          mapInstanceRef.current = map;

          const marker = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: map,
            title: address || "Practice Location",
          });

          markerInstanceRef.current = marker;

          if (address) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 200px;"><strong>${address}</strong></div>`,
            });

            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });
          }

          setMapLoaded(true);
          setMapError(null);
        } catch (error: any) {
          console.error("Map initialization error:", error);
          setMapError(
            error.message || "Failed to initialize map. Please check your API key and try again."
          );
        }
      }, 100);
    }

    // Cleanup function
    return () => {
      if (markerInstanceRef.current) {
        try {
          markerInstanceRef.current.setMap(null);
        } catch (e) {
          // Ignore cleanup errors
        }
        markerInstanceRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, address, zoom]);

  if (mapError) {
    return (
      <Card className="p-4 border-destructive/20 bg-destructive/5">
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium mb-1">Map Error</p>
            <p className="text-xs">{mapError}</p>
            <p className="text-xs mt-2 text-muted-foreground">
              Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 animate-pulse" />
            <span>Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: any;
  }
}
