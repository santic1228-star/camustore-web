"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// =====================================================
// Tipos
// =====================================================
export type TipoLinea = "compra" | "venta";

export interface LineaCarrito {
  id: string;              // id único de la línea (no del producto)
  tipo: TipoLinea;         // compra (catálogo) o venta (cotizador)
  titulo: string;          // nombre legible del item
  detalle?: string;        // detalle extra (opciones, nivel, etc.)
  precio: number;          // precio unitario (venta al cliente si compra; lo que pagamos si venta)
  cantidad: number;
}

interface CarritoContextType {
  lineas: LineaCarrito[];
  agregar: (linea: Omit<LineaCarrito, "id" | "cantidad"> & { cantidad?: number }) => void;
  quitar: (id: string) => void;
  cambiarCantidad: (id: string, cantidad: number) => void;
  vaciar: () => void;
  totalItems: number;
  totalCompra: number;
  totalVenta: number;
}

const CarritoContext = createContext<CarritoContextType | null>(null);

const STORAGE_KEY = "camustore_carrito_v1";

// =====================================================
// Provider
// =====================================================
export function CarritoProvider({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [cargado, setCargado] = useState(false);

  // Cargar de localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLineas(parsed);
      }
    } catch {
      // ignorar errores de parseo / storage
    }
    setCargado(true);
  }, []);

  // Persistir cuando cambian las líneas (solo después de la carga inicial)
  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lineas));
    } catch {
      // ignorar
    }
  }, [lineas, cargado]);

  const agregar = useCallback((linea: Omit<LineaCarrito, "id" | "cantidad"> & { cantidad?: number }) => {
    setLineas((prev) => {
      // Si ya existe una línea igual (mismo tipo, título, detalle y precio), sumo cantidad
      const existente = prev.find(
        (l) => l.tipo === linea.tipo && l.titulo === linea.titulo && l.detalle === linea.detalle && l.precio === linea.precio
      );
      if (existente) {
        return prev.map((l) =>
          l.id === existente.id ? { ...l, cantidad: l.cantidad + (linea.cantidad ?? 1) } : l
        );
      }
      const nueva: LineaCarrito = {
        ...linea,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cantidad: linea.cantidad ?? 1,
      };
      return [...prev, nueva];
    });
  }, []);

  const quitar = useCallback((id: string) => {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const cambiarCantidad = useCallback((id: string, cantidad: number) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, cantidad: Math.max(1, cantidad) } : l))
    );
  }, []);

  const vaciar = useCallback(() => setLineas([]), []);

  const totalItems = lineas.reduce((s, l) => s + l.cantidad, 0);
  const totalCompra = lineas.filter((l) => l.tipo === "compra").reduce((s, l) => s + l.precio * l.cantidad, 0);
  const totalVenta = lineas.filter((l) => l.tipo === "venta").reduce((s, l) => s + l.precio * l.cantidad, 0);

  return (
    <CarritoContext.Provider value={{ lineas, agregar, quitar, cambiarCantidad, vaciar, totalItems, totalCompra, totalVenta }}>
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return ctx;
}
