"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Undo2,
  Redo2,
  ShoppingCart,
  Image as ImageIcon,
  Shirt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";

type ProductView = "FRONT" | "BACK" | "RIGHT" | "LEFT";

type Product = {
  id: number;
  name: string;
  category: string;
  image: string;
  customizable: boolean;
};

type ProductVariant = {
  id: number;
  product_id: number;
  view: ProductView;
  color: string;
  image_url: string | null;
};

type ProductImage = {
  id: number;
  product_id: number;
  view: ProductView;
  url: string;
  created_at: string;
};

type ViewCustomization = {
  id: string;
  blobUrl: string | null; // Blob URL for local preview
  file: File | null; // Original file (for upload when order is placed)
  uploadedImageId?: number | null;
  uploadedUrl?: string | null; // URL after upload
  x: number; // 0–1 inside design area
  y: number; // 0–1 inside design area
  scale: number; // e.g. 0.5–2
  rotation?: number; // Rotation in degrees
};

type DesignArea = {
  x: number; // 0-1 relative to SVG
  y: number; // 0-1 relative to SVG
  width: number; // 0-1 relative to SVG
  height: number; // 0-1 relative to SVG
};

type ProductConfig = {
  svgs: Record<ProductView, { d: string; stroke: string; strokeWidth: number }[]>;
  designAreas: Record<ProductView, DesignArea>;
};

function CustomizeEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");
  const colorParam = searchParams.get("color");

  const [selectedView, setSelectedView] = React.useState<ProductView>("FRONT");
  const [selectedColor, setSelectedColor] = React.useState(
    colorParam || "white"
  );
  const [selectedNavItem, setSelectedNavItem] = React.useState<string | null>(
    null
  );
  const [menuTop, setMenuTop] = React.useState<number>(0);
  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [availableColors, setAvailableColors] = React.useState<string[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = React.useState<Product | null>(
    null
  );
  const [productVariants, setProductVariants] = React.useState<
    Record<ProductView, ProductVariant | null>
  >({
    FRONT: null,
    BACK: null,
    RIGHT: null,
    LEFT: null,
  });
  const [uploadedImages, setUploadedImages] = React.useState<ProductImage[]>(
    []
  );
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [selectedFilePreview, setSelectedFilePreview] = React.useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [viewCustomizations, setViewCustomizations] = React.useState<
    Record<ProductView, ViewCustomization[]>
  >({
    FRONT: [],
    BACK: [],
    RIGHT: [],
    LEFT: [],
  });
  const [selectedImageId, setSelectedImageId] = React.useState<string | null>(null);
  const stageRefs = React.useRef<Record<ProductView, any>>({
    FRONT: null,
    BACK: null,
    RIGHT: null,
    LEFT: null,
  });
  const canvasContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = React.useState({ width: 400, height: 300 });
  const [productConfig, setProductConfig] = React.useState<ProductConfig | null>(null);
  const [designAreas, setDesignAreas] = React.useState<
    Record<ProductView, DesignArea>
  >({
    FRONT: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
    BACK: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
    RIGHT: { x: 0.15, y: 0.3, width: 0.35, height: 0.3 },
    LEFT: { x: 0.5, y: 0.3, width: 0.35, height: 0.3 },
  });

  const designAreaRef = React.useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStateRef = React.useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/product-config.json');
        const config = await response.json();
        setProductConfig(config);
        setDesignAreas(config.designAreas); // Set initial design areas from config
      } catch (error) {
        console.error("Failed to load product config:", error);
      }
    };

    fetchConfig();
  }, []);

  // Update color when URL param changes
  React.useEffect(() => {
    if (colorParam) {
      setSelectedColor(colorParam);
    }
  }, [colorParam]);

  // Load product variants (colors + per-view images) and available colors
  React.useEffect(() => {
    const loadProductData = async () => {
      if (!productId) return;

      // Load product itself + all customizable products for switching
      const { data: productsData, error: productsError } = await supabase
        .from("Products")
        .select("id,name,category,image,customizable")
        .eq("customizable", true);

      if (!productsError && productsData) {
        const typed = productsData as Product[];
        setProducts(typed);
        const current = typed.find(
          (p) => String(p.id) === String(productId)
        );
        setCurrentProduct(current || null);
      } else if (productsError) {
        console.error("Supabase load Products error:", productsError.message);
      }

      // Load per-view variants (colors + base images)
      const { data: variantsData, error: variantsError } = await supabase
        .from("ProductVariants")
        .select("id,product_id,view,color,image_url")
        .eq("product_id", Number(productId));

      if (!variantsError && variantsData) {
        const typed = variantsData as ProductVariant[];
        const variantsMap: Record<ProductView, ProductVariant | null> = {
          FRONT: null,
          BACK: null,
          RIGHT: null,
          LEFT: null,
        };
        typed.forEach((v) => {
          variantsMap[v.view] = v;
        });
        setProductVariants(variantsMap);

        const colorsSet = new Set<string>();
        typed.forEach((v) => {
          if (v.color) colorsSet.add(v.color);
        });
        const colors = Array.from(colorsSet);
        if (colors.length) {
          setAvailableColors(colors);
          if (!colorParam) {
            setSelectedColor(colors[0]);
          }
        }
      } else if (variantsError) {
        console.error(
          "Supabase load ProductVariants error:",
          variantsError.message
        );
      }

      // Load previously uploaded images for this product (for all views)
      const { data: imagesData, error: imagesError } = await supabase
        .from("ProductImages")
        .select("id,product_id,view,url,created_at")
        .eq("product_id", Number(productId))
        .order("created_at", { ascending: false });

      if (!imagesError && imagesData) {
        setUploadedImages(imagesData as ProductImage[]);
      } else if (imagesError) {
        console.error(
          "Supabase load ProductImages error:",
          imagesError.message
        );
      }

      // Load design areas from Supabase (with fallback to defaults)
      const { data: designAreasData, error: designAreasError } = await supabase
        .from("DesignAreas")
        .select("view,x,y,width,height")
        .eq("product_id", Number(productId));

      if (!designAreasError && designAreasData && designAreasData.length > 0) {
        const areasMap: Record<ProductView, DesignArea> = {
          FRONT: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
          BACK: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
          RIGHT: { x: 0.15, y: 0.3, width: 0.35, height: 0.3 },
          LEFT: { x: 0.5, y: 0.3, width: 0.35, height: 0.3 },
        };
        designAreasData.forEach((area: any) => {
          if (area.view in areasMap) {
            areasMap[area.view as ProductView] = {
              x: area.x,
              y: area.y,
              width: area.width,
              height: area.height,
            };
          }
        });
        setDesignAreas(areasMap);
      } else if (designAreasError) {
        console.error(
          "Supabase load DesignAreas error:",
          designAreasError.message
        );
        // Use defaults already set in state
      }
    };

    loadProductData();
  }, [productId, colorParam]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleProductChange = (id: number) => {
    // Navigate to the same editor with a new product
    router.push(`/customize?productId=${id}&color=${selectedColor}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create blob URL for preview
    const blobUrl = URL.createObjectURL(file);
    setSelectedFilePreview(blobUrl);
  };

  const handleAddImageToCanvas = () => {
    if (!selectedFile || !selectedFilePreview) return;

    const newImageId = `${selectedView}-${Date.now()}`;
    const img = new window.Image();
    img.src = selectedFilePreview;
    img.onload = () => {
      const scale = getFitScale(img.width, img.height, canvasSize.width, canvasSize.height);
      const newCustomization: ViewCustomization = {
        id: newImageId,
        blobUrl: selectedFilePreview,
        file: selectedFile,
        x: 0.5,
        y: 0.5,
        scale: scale,
        rotation: 0,
      };

      setViewCustomizations((prev) => ({
        ...prev,
        [selectedView]: [...prev[selectedView], newCustomization],
      }));

      setSelectedImageId(newImageId);
      setSelectedFile(undefined);
      setSelectedFilePreview(null);
    };
  };

  const handleDeleteCurrentImage = () => {
    if (!selectedImageId) return;

    setViewCustomizations((prev) => {
      const newCustomizations = prev[selectedView].filter((cust) => {
        if (cust.id === selectedImageId) {
          if (cust.blobUrl) {
            URL.revokeObjectURL(cust.blobUrl);
          }
          return false;
        }
        return true;
      });

      return {
        ...prev,
        [selectedView]: newCustomizations,
      };
    });

    setSelectedImageId(null);
  };

  const getFitScale = (imgWidth: number, imgHeight: number, canvasWidth: number, canvasHeight: number) => {
    const widthScale = canvasWidth / imgWidth;
    const heightScale = canvasHeight / imgHeight;
    return Math.min(widthScale, heightScale, 1); // Ensure it doesn't scale up beyond original size
  };

  const handleSelectExistingImage = async (image: ProductImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const newImageId = `${selectedView}-${Date.now()}`;
      const img = new window.Image();
      img.src = blobUrl;
      img.onload = () => {
        const scale = getFitScale(img.width, img.height, canvasSize.width, canvasSize.height);
        const newCustomization: ViewCustomization = {
          id: newImageId,
          blobUrl: blobUrl,
          file: null, // Already uploaded
          uploadedImageId: image.id,
          uploadedUrl: image.url,
          x: 0.5,
          y: 0.5,
          scale: scale,
          rotation: 0,
        };

        setViewCustomizations((prev) => ({
          ...prev,
          [selectedView]: [...prev[selectedView], newCustomization],
        }));

        setSelectedImageId(newImageId);
      };
    } catch (error) {
      console.error("Failed to load image:", error);
      alert("Failed to load image. Please try again.");
    }
  };

  const generatePDF = async (): Promise<string | null> => {
    if (!productId || !currentProduct) return null;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;
      const viewWidth = contentWidth / 2 - 5;
      const viewHeight = contentHeight / 2 - 5;

      const views: ProductView[] = ["FRONT", "BACK", "LEFT", "RIGHT"];
      const positions = [
        [margin, margin],
        [margin + viewWidth + 10, margin],
        [margin, margin + viewHeight + 10],
        [margin + viewWidth + 10, margin + viewHeight + 10],
      ];

      // Create a temporary container to render views
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "800px";
      container.style.height = "600px";
      container.style.background = "#f5f3f0";
      document.body.appendChild(container);

      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        const [x, y] = positions[i];

        // Create a canvas for this view
        const viewContainer = document.createElement("div");
        viewContainer.style.width = "400px";
        viewContainer.style.height = "300px";
        viewContainer.style.background = "#f5f3f0";
        viewContainer.style.position = "relative";
        container.appendChild(viewContainer);

        // Render SVG for this view
        const svgContainer = document.createElement("div");
        svgContainer.innerHTML = renderShirtSVG(view, selectedColor);
        viewContainer.appendChild(svgContainer.firstChild as Node);

        // Capture Konva canvas if it exists
        const stage = stageRefs.current[view];
        let canvasDataUrl = "";

        if (stage) {
          // Get the canvas from Konva stage
          const dataURL = stage.toDataURL({ pixelRatio: 2 });
          canvasDataUrl = dataURL;
        }

        // Create a composite image with SVG background and Konva canvas overlay
        const compositeCanvas = document.createElement("canvas");
        compositeCanvas.width = 400;
        compositeCanvas.height = 300;
        const ctx = compositeCanvas.getContext("2d");
        
        if (ctx) {
          // Draw background
          ctx.fillStyle = "#f5f3f0";
          ctx.fillRect(0, 0, 400, 300);

          // Draw SVG (we'll use the SVG as background)
          const svgImg = new window.Image();
          const svgBlob = new Blob([renderShirtSVG(view, selectedColor)], { type: "image/svg+xml" });
          const svgUrl = URL.createObjectURL(svgBlob);
          
          await new Promise((resolve) => {
            svgImg.onload = () => {
              ctx.drawImage(svgImg, 0, 0, 400, 300);
              URL.revokeObjectURL(svgUrl);
              
              // Draw Konva canvas overlay if exists
              if (canvasDataUrl) {
                const konvaImg = new window.Image();
                konvaImg.onload = () => {
                  ctx.drawImage(konvaImg, 0, 0, 400, 300);
                  resolve(null);
                };
                konvaImg.src = canvasDataUrl;
              } else {
                resolve(null);
              }
            };
            svgImg.src = svgUrl;
          });

          const imgData = compositeCanvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", x, y, viewWidth, viewHeight);
        }

        container.removeChild(viewContainer);
      }

      document.body.removeChild(container);

      // Save PDF to blob
      const pdfBlob = pdf.output("blob");

      // Upload PDF to Supabase Storage
      const pdfFileName = `order-${productId}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("Chosen Threads")
        .upload(`orders/${pdfFileName}`, pdfBlob, {
          contentType: "application/pdf",
        });

      if (uploadError) {
        console.error("PDF upload error:", uploadError);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("Chosen Threads")
        .getPublicUrl(`orders/${pdfFileName}`);

      return publicUrl;
    } catch (error) {
      console.error("PDF generation error:", error);
      return null;
    }
  };

  const renderShirtSVG = (view: ProductView, color: string): string => {
    if (!productConfig) return '';

    const svgPaths = productConfig.svgs[view]
      .map(
        (p) =>
          `<path d="${p.d}" fill="${color}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}"/>`
      )
      .join('');

    return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">${svgPaths}</svg>`;
  };

  const handleOrder = async () => {
    if (!productId || !currentProduct) return;

    try {
      setIsGeneratingPDF(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/customize?productId=" + productId);
        return;
      }

      // Step 1: Upload remaining images (those with files but not yet uploaded)
      const uploadedImageUrls: string[] = [];
      const views: ProductView[] = ["FRONT", "BACK", "LEFT", "RIGHT"];
      
      for (const view of views) {
        const customizations = viewCustomizations[view];
        for (const customization of customizations) {
          if (customization?.file && !customization.uploadedUrl) {
            // Upload the file
            const filePath = `${productId}/${view}/${Date.now()}-${customization.file.name}`;
            const { error: uploadError } = await supabase.storage
              .from("Chosen Threads")
              .upload(filePath, customization.file);

            if (uploadError) {
              console.error("Upload error:", uploadError);
              continue;
            }

            const { data: { publicUrl } } = supabase.storage
              .from("Chosen Threads")
              .getPublicUrl(filePath);

            uploadedImageUrls.push(publicUrl);

            // Update state with uploaded URL
            setViewCustomizations((prev) => ({
              ...prev,
              [view]: prev[view].map((c) => 
                c.id === customization.id ? { ...c, uploadedUrl: publicUrl } : c
              ),
            }));
          } else if (customization?.uploadedUrl) {
            uploadedImageUrls.push(customization.uploadedUrl);
          }
        }
      }

      // Step 2: Capture canvas for each view and generate PDF
      const pdfUrl = await generatePDF();
      if (!pdfUrl) {
        alert("Failed to generate PDF. Please try again.");
        setIsGeneratingPDF(false);
        return;
      }

      // Step 3: Save metadata
      const orderData = {
        user_id: user.id,
        product_id: Number(productId),
        color: selectedColor,
        pdf_url: pdfUrl,
        customization_images: uploadedImageUrls,
        view_customizations: viewCustomizations,
        status: "pending",
      };

      // Try to insert into Orders table first, fallback to Cart
      const { data: orderInsert, error: orderError } = await supabase
        .from("Orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        // Fallback to Cart table
        const { data: cartInsert, error: cartError } = await supabase
          .from("Cart")
          .insert(orderData)
          .select()
          .single();

        if (cartError) {
          console.error("Failed to create order/cart:", cartError);
          alert("Failed to add to cart. Please try again.");
          setIsGeneratingPDF(false);
          return;
        }

        alert("Added to cart successfully!");
        router.push("/checkout");
      } else {
        alert("Order placed successfully!");
        router.push("/checkout");
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const currentCustomization = React.useMemo(() => {
    return viewCustomizations[selectedView].find(
      (c) => c.id === selectedImageId
    );
  }, [selectedImageId, selectedView, viewCustomizations]);

  const handleScaleChange = (value: number[]) => {
    if (!selectedImageId) return;
    const scale = value[0];

    setViewCustomizations((prev) => {
      const newCustomizations = prev[selectedView].map((cust) =>
        cust.id === selectedImageId ? { ...cust, scale } : cust
      );
      return {
        ...prev,
        [selectedView]: newCustomizations,
      };
    });
  };

  // Update canvas size when container resizes
  React.useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [selectedView, designAreas]);

  // Konva Image Component
  const EditableImage: React.FC<{ 
    customization: ViewCustomization;
    canvasWidth: number; 
    canvasHeight: number; 
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: Partial<ViewCustomization>) => void;
  }> = ({ customization, canvasWidth, canvasHeight, isSelected, onSelect, onChange }) => {
    const [image, setImage] = React.useState<HTMLImageElement | null>(null);
    const imageRef = React.useRef<any>(null);
    const transformerRef = React.useRef<any>(null);

    React.useEffect(() => {
      if (!customization.blobUrl) {
        setImage(null);
        return;
      }

      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = customization.blobUrl;
      img.onload = () => setImage(img);
      img.onerror = () => setImage(null);
      
      return () => {
        // Cleanup if the component unmounts or blobUrl changes
        img.onload = null;
        img.onerror = null;
      };
    }, [customization.blobUrl]);

    React.useEffect(() => {
      if (isSelected && transformerRef.current && imageRef.current) {
        transformerRef.current.nodes([imageRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      } else if (!isSelected && transformerRef.current) {
        transformerRef.current.nodes([]);
      }
    }, [isSelected, image]);

    if (!customization.blobUrl || !image) return null;

    // Use actual canvas dimensions - design area is the full canvas now
    const areaWidth = canvasWidth;
    const areaHeight = canvasHeight;
    const areaX = 0;
    const areaY = 0;

    // Convert relative position (0-1) to absolute canvas coordinates
    const x = customization.x * areaWidth;
    const y = customization.y * areaHeight;

    // Calculate image dimensions for constraint checking
    const imageWidth = image.width * (customization.scale || 1);
    const imageHeight = image.height * (customization.scale || 1);

    return (
      <>
        <KonvaImage
          ref={imageRef}
          image={image}
          x={x}
          y={y}
          scaleX={customization.scale}
          scaleY={customization.scale}
          rotation={customization.rotation || 0}
          draggable
          onClick={(e) => {
            e.cancelBubble = true;
            onSelect();
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onSelect();
          }}
          offsetX={image.width / 2}
          offsetY={image.height / 2}
          onDragMove={(e) => {
            const node = e.target;
            const stage = node.getStage();
            if (!stage) return;

            const box = node.getClientRect();
            const stageWidth = stage.width();
            const stageHeight = stage.height();

            let newX = node.x();
            let newY = node.y();

            // Top-left corner
            if (box.x < 0) newX -= box.x;
            if (box.y < 0) newY -= box.y;

            // Bottom-right corner
            if (box.x + box.width > stageWidth) newX -= (box.x + box.width - stageWidth);
            if (box.y + box.height > stageHeight) newY -= (box.y + box.height - stageHeight);

            node.position({ x: newX, y: newY });
          }}
          onDragEnd={(e) => {
            const node = e.target;
            const newX = node.x() / areaWidth;
            const newY = node.y() / areaHeight;
            
            onChange({ x: newX, y: newY });
          }}
          onTransform={(e) => {
            const node = e.target;
            const stage = node.getStage();
            if (!stage) return;

            const box = node.getClientRect();
            const stageWidth = stage.width();
            const stageHeight = stage.height();

            let newX = node.x();
            let newY = node.y();

            // Top-left corner
            if (box.x < 0) newX -= box.x;
            if (box.y < 0) newY -= box.y;

            // Bottom-right corner
            if (box.x + box.width > stageWidth) newX -= (box.x + box.width - stageWidth);
            if (box.y + box.height > stageHeight) newY -= (box.y + box.height - stageHeight);

            node.position({ x: newX, y: newY });
          }}
          onTransformEnd={() => {
            const node = imageRef.current;
            if (!node) return;
            
            const scaleX = node.scaleX();
            const rotation = node.rotation();
            const newX = node.x() / areaWidth;
            const newY = node.y() / areaHeight;

            onChange({
              x: newX,
              y: newY,
              scale: scaleX,
              rotation: rotation,
            });
          }}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            borderEnabled={true}
            borderStroke="#4A90E2"
            borderStrokeWidth={2}
            anchorFill="#4A90E2"
            anchorStroke="#fff"
            anchorSize={8}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit minimum size
              if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </>
    );
  };



  const navItems = [
    { id: "products", label: "Products", icon: Shirt },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "order", label: "Order", icon: ShoppingCart },
  ];

  const productViews: ProductView[] = ["FRONT", "BACK", "RIGHT", "LEFT"];

  const actionButtons = [
    { id: "undo", label: "Undo", icon: Undo2 },
    { id: "redo", label: "Redo", icon: Redo2 },
    
  ];

  const colorsToRender = availableColors.length
    ? availableColors
    : ["white", "#111827", "#f97316", "#16a34a", "#1d4ed8"];

  const handleNavItemClick = (itemId: string, buttonElement: HTMLButtonElement | null) => {
    if (selectedNavItem === itemId) {
      setSelectedNavItem(null);
      return;
    }

    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const sidebarRect = buttonElement.closest('aside')?.getBoundingClientRect();
      if (sidebarRect) {
        // Calculate center of button relative to sidebar
        const buttonCenterY = rect.top + rect.height / 2 - sidebarRect.top;
        // Set top position, ensuring menu doesn't overflow above the screen
        // We'll use a minimum top value to prevent overflow
        const minTop = 20; // Minimum distance from top
        setMenuTop(Math.max(minTop, buttonCenterY));
      }
    }
    setSelectedNavItem(itemId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f3f0]">
      {/* Left Sidebar */}
      <div className="relative flex">
      <aside className="w-64 bg-[#f5f3f0] border-r border-[#e8e5e0] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#e8e5e0]">
          <Link href="/">
          <Image src="/logo.jpg" alt="Chosen Threads Logo" width={100} height={100} />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedNavItem === item.id;
              return (
                <li key={item.id}>
                  <button
                    ref={(el) => { buttonRefs.current[item.id] = el; }}
                    onClick={(e) => handleNavItemClick(item.id, e.currentTarget)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:bg-white/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                        {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Flyout menu (opens to the right of the sidebar buttons) */}
      {selectedNavItem && (
        <div 
          className="absolute left-full w-80 bg-white border-r border-[#e8e5e0] shadow-xl overflow-y-auto z-50"
          style={{
            top: `80px`, // Position below the header
            maxHeight: 'calc(100vh - 100px)', // Adjust height to fit
          }}
        >
          <div className="p-4">
            {selectedNavItem === "products" && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Product
                </h3>
                {currentProduct ? (
                  <div className="flex items-center gap-3 mb-3">
                    {currentProduct.image && (
                      <div className="relative h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                        <Image
                          src={currentProduct.image}
                          alt={currentProduct.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {currentProduct.name}
                      </div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">
                        {currentProduct.category}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-3">
                    Loading product details...
                  </p>
                )}

                {products.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Switch product
                    </p>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleProductChange(p.id)}
                          className={cn(
                            "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-gray-50",
                            currentProduct && currentProduct.id === p.id
                              ? "bg-gray-100 font-semibold"
                              : "text-gray-600"
                          )}
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-[10px] font-semibold">
                            #{p.id}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[#f3f0ea] space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Colors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colorsToRender.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 border-transparent ring-2 ring-transparent transition-all",
                          selectedColor === color &&
                            "ring-gray-900 ring-offset-2 ring-offset-white"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedNavItem === "order" && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Order
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Review your customizations and place your order.
                  </p>
                  <Button
                    onClick={handleOrder}
                    disabled={isGeneratingPDF}
                    className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {isGeneratingPDF ? "Processing..." : "Place Order"}
                  </Button>
                  {isGeneratingPDF && (
                    <p className="text-xs text-gray-500 text-center">
                      Uploading images, generating PDF...
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedNavItem === "image" && (
              <div className="space-y-4 h-full overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Artwork
                </h3>
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-wide text-gray-400">
                    Choose image
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <p className="text-[11px] text-gray-400">
                    PNG or JPG, up to 5MB.
                  </p>
                  
                  {selectedFilePreview && (
                    <div className="space-y-2">
                      <div className="relative h-24 w-full overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50">
                        <Image
                          src={selectedFilePreview}
                          alt="Selected file preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button
                        onClick={handleAddImageToCanvas}
                        disabled={isUploading}
                        className="w-full bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        {isUploading ? "Adding..." : "Add to Canvas"}
                      </Button>
                    </div>
                  )}
                  
                  {isUploading && !selectedFilePreview && (
                    <p className="text-[11px] text-gray-500">
                      Uploading image...
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f3f0ea] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      Placed image
                    </p>
                    {viewCustomizations[selectedView].length > 0 && (
                      <button
                        onClick={handleDeleteCurrentImage}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {currentCustomization ? (
                    <div className="relative h-24 w-full overflow-hidden rounded-md border border-dashed border-gray-200 bg-gray-50">
                      <Image
                        src={currentCustomization.blobUrl!}
                        alt="Current placement"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : viewCustomizations[selectedView].length > 0 ? (
                    <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-400">
                      Select an image on the canvas to edit it.
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-400">
                      No image placed yet.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f3f0ea] space-y-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Scale
                  </p>
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={[currentCustomization?.scale ?? 1]}
                    onValueChange={handleScaleChange}
                  />
                </div>

                <div className="pt-3 border-t border-[#f3f0ea] space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    Previous uploads
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                    {uploadedImages.length === 0 && (
                      <p className="col-span-3 text-[11px] text-gray-400">
                        No previous images yet.
                      </p>
                    )}
                    {uploadedImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => handleSelectExistingImage(img)}
                        className="relative h-16 w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50 hover:border-gray-400 hover:border-orange-400 transition-colors"
                        title={`Click to place in ${selectedView.toLowerCase()} view`}
                      >
                        <Image
                          src={img.url}
                          alt="Uploaded artwork"
                          fill
                          className="object-contain"
                        />
                        {img.view !== selectedView && (
                          <div className="absolute top-0 right-0 bg-gray-800/70 text-white text-[8px] px-1 py-0.5 rounded-bl">
                            {img.view}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-[#e8e5e0] flex items-center justify-between px-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            {actionButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg px-6 py-2 text-sm font-semibold"
            >
              Tutorials
            </Button>
            <Button
              onClick={handleOrder}
              disabled={isGeneratingPDF}
              className="bg-orange-500 text-white hover:bg-orange-600 rounded-lg px-6 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {isGeneratingPDF ? "Generating PDF..." : "Order"}
            </Button>
          </div>
        </header>

        {/* Central Display Area */}
        <main className="flex-1 flex items-center justify-center bg-[#f5f3f0] p-8 overflow-auto">
          <div className="relative w-full h-full max-w-2xl flex items-center justify-center">
            {/* T-shirt Display */}
            <div className="relative w-full max-w-md flex items-center justify-center">
              {/* T-shirt SVG - Dynamic based on view */}
              <div
                className="w-full h-auto max-h-[600px]"
                dangerouslySetInnerHTML={{
                  __html: renderShirtSVG(selectedView, selectedColor),
                }}
              />

              {/* Konva Canvas for design area - overlays SVG */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  ref={canvasContainerRef}
                  className="absolute pointer-events-auto border-2 border-dashed border-gray-400/60 bg-white/5 rounded-md"
                  style={{
                    left: `${designAreas[selectedView].x * 100}%`,
                    top: `${designAreas[selectedView].y * 100}%`,
                    width: `${designAreas[selectedView].width * 100}%`,
                    height: `${designAreas[selectedView].height * 100}%`,
                  }}
                >
                  <Stage
                    width={canvasSize.width}
                    height={canvasSize.height}
                    ref={(ref) => { stageRefs.current[selectedView] = ref; }}
                    onMouseDown={(e) => {
                      const clickedOnEmpty = e.target === e.target.getStage();
                      if (clickedOnEmpty) {
                        setSelectedImageId(null);
                      }
                    }}
                    onTouchStart={(e) => {
                      const clickedOnEmpty = e.target === e.target.getStage();
                      if (clickedOnEmpty) {
                        setSelectedImageId(null);
                      }
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Layer>
                      {viewCustomizations[selectedView].map((cust) => (
                        <EditableImage
                          key={cust.id}
                          customization={cust}
                          canvasWidth={canvasSize.width}
                          canvasHeight={canvasSize.height}
                          isSelected={selectedImageId === cust.id}
                          onSelect={() => setSelectedImageId(cust.id)}
                          onChange={(newAttrs) => {
                            setViewCustomizations((prev) => {
                              const newCustomizations = prev[selectedView].map((c) =>
                                c.id === cust.id ? { ...c, ...newAttrs } : c
                              );
                              return {
                                ...prev,
                                [selectedView]: newCustomizations,
                              };
                            });
                          }}
                        />
                      ))}
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Right Sidebar */}
      <aside className="w-64 bg-white border-l border-[#e8e5e0] flex flex-col items-center py-6 px-4 align-middle ">
        {/* Product View Thumbnails */}
        <div className="space-y-4 my-auto">
          {productViews.map((view) => {
            const isSelected = selectedView === view;
            return (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  isSelected && "scale-105"
                )}
              >
                <div
                  className={cn(
                    "w-20 h-20 rounded-full border-2 overflow-hidden bg-gray-100 flex items-center justify-center",
                    isSelected
                      ? "border-blue-500 shadow-lg"
                      : "border-gray-300"
                  )}
                >
                  {/* Mini t-shirt preview */}
                  <div
                    className="relative h-14 w-14"
                    dangerouslySetInnerHTML={{
                      __html: renderShirtSVG(view, selectedColor),
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                  {view}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-[#f5f3f0]">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <CustomizeEditor />
    </Suspense>
  );
}

