import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Menu } from "./logic";
import { supabase } from "./supabase";

type MenuContextValue = {
  menus: Menu[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  addMenu: (menu: Omit<Menu, "id">) => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

// ตัวเก็บ state กลาง — ข้อมูลมาจาก Supabase
export function MenuProvider({ children }: { children: ReactNode }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  // ทำงานตอนเปิดแอป และทุกครั้งที่ reloadCount เปลี่ยน
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("menus") // อ้างอิงชื่อ table 'menus' ใน Supabase
        .select("*")
        .order("price");
        
      if (error) {
        setError(error.message);
      } else {
        setMenus(data as Menu[]);
        setError(null);
      }
      setLoading(false);
    }
    load();
  }, [reloadCount]);

  const reload = () => {
    setReloadCount(reloadCount + 1);
  };

  // บันทึกข้อมูลลงฐานข้อมูล Supabase
  const addMenu = async (menu: Omit<Menu, "id">) => {
    const { data, error } = await supabase
      .from("menus")
      .insert([menu])
      .select(); // ใส่ .select() เพื่อให้คืนค่าข้อมูลที่เพิ่มพร้อม id

    if (error) {
      console.error("Error adding menu:", error.message);
      setError(error.message);
    } else if (data) {
      // นำข้อมูลที่เพิ่ง insert สำเร็จมาอัปเดตต่อท้ายใน state 
      setMenus([...menus, data[0] as Menu]);
    }
  };

  return (
    <MenuContext.Provider
      value={{ menus, loading, error, reload, addMenu }}
    >
      {children}
    </MenuContext.Provider>
  );
}

// หน้าจอไหนอยากใช้ข้อมูลเมนู เรียก useMenus()
export function useMenus() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenus ต้องอยู่ภายใน <MenuProvider>");
  return ctx;
}