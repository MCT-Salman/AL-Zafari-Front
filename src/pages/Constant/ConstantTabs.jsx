import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConstantType from "./ConstantType";
import ConstantValue from "./ConstantValue";
import Material from "./Material";
import Color from "./Color";
import PriceColor from "./PriceColor";
import Batch from "./Batch";
import Ruler from "./Ruler";


const ConstantTabs = () => {
  const [activeTab, setActiveTab] = useState("constant_type");

  const tabs = [
    { value: "constant_type", label: "أنواع الثوابت" },
    { value: "constant_value", label: "قيم الثوابت" },
    { value: "material", label: "المواد" },
    { value: "color", label: "الألوان" },
    { value: "price_color", label: "السعر حسب اللون" },
    { value: "ruler", label: "المساطر" },
    { value: "batch", label: "الطبخات" }
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-3xl font-bold text-center text-secondary">
        إدارة الثوابت
      </h1>

      {/* للشاشات الصغيرة - قائمة منسدلة */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر قسم" />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        {/* للشاشات المتوسطة والكبيرة - تبويبات عادية */}
        <TabsList className="hidden md:grid md:grid-cols-7 gap-2 justify-center w-full bg-muted rounded-lg p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* محتوى التبويبات */}
        <div className="mt-3 md:mt-4 bg-background rounded-lg p-3 md:p-4 shadow-sm">
          <TabsContent value="constant_type" className="space-y-3 md:space-y-4">
            <ConstantType />
          </TabsContent>
          <TabsContent value="constant_value" className="space-y-3 md:space-y-4">
            <ConstantValue />
          </TabsContent>
          <TabsContent value="material" className="space-y-3 md:space-y-4">
            <Material />
          </TabsContent>
          <TabsContent value="color" className="space-y-3 md:space-y-4">
            <Color />
          </TabsContent>
          <TabsContent value="price_color" className="space-y-3 md:space-y-4">
            <PriceColor />
          </TabsContent>
          <TabsContent value="ruler" className="space-y-3 md:space-y-4">
            <Ruler />
          </TabsContent>
          <TabsContent value="batch" className="space-y-3 md:space-y-4">
            <Batch />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ConstantTabs;