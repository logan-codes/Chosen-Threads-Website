"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import JSZip from 'jszip';
import { toast } from 'sonner';
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { Header } from "@/components/customizer/Header";
import Tutorial from '@/components/Tutorial';
import { LeftSidebar } from "@/components/customizer/LeftSidebar";
import { RightSidebar } from "@/components/customizer/RightSidebar";

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
  svgs: Record<
    ProductView,
    { d: string; stroke: string; strokeWidth: number }[]
  >;
  designAreas: Record<ProductView, DesignArea>;
};

function CustomizeEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");
  const colorParam = searchParams.get("color");

  const [selectedView, setSelectedView] = React.useState<ProductView>("FRONT");
  const [selectedColor, setSelectedColor] = React.useState(
    colorParam || "white",
  );
  const [selectedNavItem, setSelectedNavItem] = React.useState<string | null>(
    null,
  );
  const [menuTop, setMenuTop] = React.useState<number>(0);
  const [availableColors, setAvailableColors] = React.useState<string[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = React.useState<Product | null>(
    null,
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
    [],
  );
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [selectedFilePreview, setSelectedFilePreview] = React.useState<
    string | null
  >(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  const resetCustomizer = React.useCallback(() => {
    setSelectedView("FRONT");
    setSelectedColor(colorParam || (availableColors.length > 0 ? availableColors[0] : "white"));
    setViewCustomizations({
      FRONT: [],
      BACK: [],
      RIGHT: [],
      LEFT: [],
    });
    setSelectedImageId(null);
    setSelectedFile(undefined);
    setSelectedFilePreview(null);
  }, [availableColors, colorParam]);
  const [viewCustomizations, setViewCustomizations] = React.useState<
    Record<ProductView, ViewCustomization[]>
  >({
    FRONT: [],
    BACK: [],
    RIGHT: [],
    LEFT: [],
  });
  const [selectedImageId, setSelectedImageId] = React.useState<string | null>(
    null,
  );
  const stageRefs = React.useRef<Record<ProductView, any>>({
    FRONT: null,
    BACK: null,
    RIGHT: null,
    LEFT: null,
  });
  const canvasContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = React.useState({
    width: 400,
    height: 300,
  });
  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);
  const [productConfig, setProductConfig] =
    React.useState<ProductConfig | null>(null);
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
        const response = await fetch("/product-config.json");
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
        const current = typed.find((p) => String(p.id) === String(productId));
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
          variantsError.message,
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
          imagesError.message,
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
          designAreasError.message,
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
      const scale = getFitScale(
        img.width,
        img.height,
        canvasSize.width,
        canvasSize.height,
      );
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

  const getFitScale = (
    imgWidth: number,
    imgHeight: number,
    canvasWidth: number,
    canvasHeight: number,
  ) => {
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
        const scale = getFitScale(
          img.width,
          img.height,
          canvasSize.width,
          canvasSize.height,
        );
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

  const renderShirtSVG = React.useCallback((view: ProductView, color: string): string => {
    if (!productConfig) return "";

    const svgPaths = productConfig.svgs[view]
      .map(
        (p) =>
          `<path d=\"${p.d}\" fill=\"${color}\" stroke=\"${p.stroke}\" stroke-width=\"${p.strokeWidth}\"/>`,
      )
      .join("");

    return `<svg viewBox=\"0 0 300 400\" xmlns=\"http://www.w3.org/2000/svg\" style=\"width: 100%; height: 100%;\">${svgPaths}</svg>`;
  }, [productConfig]);

  const generatePDF = React.useCallback(async (): Promise<Blob | null> => {
    // if (!productId || !currentProduct) return null;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const viewWidth = contentWidth / 2 - 5;
      const viewHeight = (viewWidth * 4) / 3; // Maintain 4:3 aspect ratio

      const views: ProductView[] = ["FRONT", "BACK", "LEFT", "RIGHT"];
      const positions = [
        [margin, margin],
        [margin + viewWidth + 10, margin],
        [margin, margin + viewHeight + 10],
        [margin + viewWidth + 10, margin + viewHeight + 10],
      ];

      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        const [x, y] = positions[i];

        const customizations = viewCustomizations[view];

        // Create a composite image with SVG background and Konva canvas overlay
        const compositeCanvas = document.createElement("canvas");
        const onScreenAspectRatio = canvasSize.width / canvasSize.height;
        const canvasWidth = 400;
        const canvasHeight = canvasWidth / onScreenAspectRatio;
        compositeCanvas.width = canvasWidth;
        compositeCanvas.height = canvasHeight;
        const ctx = compositeCanvas.getContext("2d");

        if (ctx) {
          // Draw SVG background
          const svgImg = new window.Image();
          const svgBlob = new Blob([renderShirtSVG(view, selectedColor)], {
            type: "image/svg+xml",
          });
          const svgUrl = URL.createObjectURL(svgBlob);

          await new Promise<void>((resolve) => {
            svgImg.onload = () => {
              ctx.drawImage(svgImg, 0, 0, canvasWidth, canvasHeight);
              URL.revokeObjectURL(svgUrl);
              resolve();
            };
            svgImg.src = svgUrl;
          });

          // Draw customizations on top
          for (const cust of customizations) {
            if (cust.blobUrl) {
              const img = new window.Image();
              img.crossOrigin = "anonymous";

              await new Promise<void>((resolve) => {
                img.onload = () => {
                  const area = designAreas[view];
                  const areaX = area.x * canvasWidth;
                  const areaY = area.y * canvasHeight;
                  const areaW = area.width * canvasWidth;
                  const areaH = area.height * canvasHeight;

                  // Adjust scale based on the difference between on-screen canvas and PDF canvas
                  const scaleFactor = canvasWidth / canvasSize.width;
                  const finalScale = cust.scale * scaleFactor;

                  ctx.save();
                  ctx.translate(areaX + cust.x * areaW, areaY + cust.y * areaH);
                  ctx.rotate((cust.rotation || 0) * (Math.PI / 180));
                  ctx.scale(finalScale, finalScale);
                  ctx.drawImage(img, -img.width / 2, -img.height / 2);
                  ctx.restore();
                  resolve();
                };
                const blobUrl = cust.blobUrl;
                if (blobUrl) {
                  img.src = blobUrl;
                } else {
                  resolve(); // Resolve the promise if no blobUrl to avoid hanging
                }
              });
            }
          }

          const imgData = compositeCanvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", x, y, viewWidth, viewHeight);
        }
      }

      return pdf.output("blob");
    } catch (error) {
      console.error("PDF generation error:", error);
      return null;
    }
  }, [productId, currentProduct, selectedColor, renderShirtSVG, viewCustomizations, designAreas, canvasSize]);


  const handleOrder = React.useCallback(async () => {
    // if (!productId || !currentProduct) return;

    const orderToast = toast.loading('Starting your order...');

    try {
      setIsGeneratingPDF(true);

      toast.loading('Generating PDF...', { id: orderToast });
      const pdfBlob = await generatePDF();

      if (!pdfBlob) {
        toast.error('Failed to generate PDF. Please try again.', { id: orderToast });
        return;
      }
      toast.success('PDF generated successfully!', { id: orderToast });

      toast.loading('Creating zip file...', { id: orderToast });
      const zip = new JSZip();
      zip.file(`design-${productId}.pdf`, pdfBlob);

      const imageFiles: File[] = [];
      Object.values(viewCustomizations).forEach(customizations => {
        customizations.forEach(cust => {
          if (cust.file && !imageFiles.some(f => f.name === cust.file!.name)) {
            imageFiles.push(cust.file);
          }
        });
      });

      imageFiles.forEach(file => {
        zip.file(`images/${file.name}`, file);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      toast.success('Zip file created!', { id: orderToast });

      toast.loading('Preparing download...', { id: orderToast });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `chosenthreads-design-${productId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started! Resetting page.', { id: orderToast, duration: 4000 });

      resetCustomizer();

    } catch (error) {
      console.error("Order error:", error);
      toast.error('An error occurred. Please try again.', { id: orderToast });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [productId, currentProduct, viewCustomizations, generatePDF, resetCustomizer]);

  const currentCustomization = React.useMemo(() => {
    return viewCustomizations[selectedView].find(
      (c) => c.id === selectedImageId,
    );
  }, [selectedImageId, selectedView, viewCustomizations]);

  const handleScaleChange = (value: number[]) => {
    if (!selectedImageId) return;
    const scale = value[0];

    setViewCustomizations((prev) => {
      const newCustomizations = prev[selectedView].map((cust) =>
        cust.id === selectedImageId ? { ...cust, scale } : cust,
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
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [selectedView, designAreas]);

  // Konva Image Component
  const EditableImage: React.FC<{
    customization: ViewCustomization;
    canvasWidth: number;
    canvasHeight: number;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: Partial<ViewCustomization>) => void;
  }> = ({
    customization,
    canvasWidth,
    canvasHeight,
    isSelected,
    onSelect,
    onChange,
  }) => {
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
            if (box.x + box.width > stageWidth)
              newX -= box.x + box.width - stageWidth;
            if (box.y + box.height > stageHeight)
              newY -= box.y + box.height - stageHeight;

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
            if (box.x + box.width > stageWidth)
              newX -= box.x + box.width - stageWidth;
            if (box.y + box.height > stageHeight)
              newY -= box.y + box.height - stageHeight;

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

  const productViews: ProductView[] = ["FRONT", "BACK", "RIGHT", "LEFT"];

  const colorsToRender = availableColors.length
    ? availableColors
    : ["white", "#111827", "#f97316", "#16a34a", "#1d4ed8"];

  const handleNavItemClick = (
    itemId: string,
    buttonElement: HTMLButtonElement | null,
  ) => {
    if (selectedNavItem === itemId) {
      setSelectedNavItem(null);
      return;
    }

    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const sidebarRect = buttonElement
        .closest("aside")
        ?.getBoundingClientRect();
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
      <Tutorial isOpen={isTutorialOpen} setIsOpen={setIsTutorialOpen} />
      <LeftSidebar
        selectedNavItem={selectedNavItem}
        onNavItemClick={handleNavItemClick}
        menuTop={menuTop}
        currentProduct={currentProduct}
        products={products}
        onProductChange={handleProductChange}
        availableColors={availableColors}
        selectedColor={selectedColor}
        onColorSelect={handleColorSelect}
        onOrder={handleOrder}
        onFileSelect={handleFileSelect}
        selectedFilePreview={selectedFilePreview}
        onAddImageToCanvas={handleAddImageToCanvas}
        isUploading={isUploading}
        viewCustomizations={viewCustomizations}
        selectedView={selectedView}
        onDeleteCurrentImage={handleDeleteCurrentImage}
        currentCustomization={currentCustomization}
        onScaleChange={handleScaleChange}
        uploadedImages={uploadedImages}
        onSelectExistingImage={handleSelectExistingImage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header
          onOrder={handleOrder}
          onTutorial={() => setIsTutorialOpen(true)}
        />

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
                    ref={(ref) => {
                      stageRefs.current[selectedView] = ref;
                    }}
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
                    style={{ width: "100%", height: "100%" }}
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
                              const newCustomizations = prev[selectedView].map(
                                (c) =>
                                  c.id === cust.id ? { ...c, ...newAttrs } : c,
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

      <RightSidebar
        productViews={productViews}
        selectedView={selectedView}
        onSelectView={setSelectedView}
        renderShirtSVG={renderShirtSVG}
        selectedColor={selectedColor}
      />
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#f5f3f0]">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <CustomizeEditor />
    </Suspense>
  );
}
