"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import JSZip from 'jszip';
import { toast } from 'sonner';
import { SecureFileValidator } from "@/lib/fileSecurity";
import { SecureSVGRenderer, isValidColor } from "@/lib/svgSecurity";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  rating: number; // This might be the price field, or check if price exists
  tag?: string;
  price?: number; // Add optional price field
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
  image_url: string;
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
  const [productVariants, setProductVariants] = React.useState<ProductVariant[]>([]);

  const [uploadedImages, setUploadedImages] = React.useState<ProductImage[]>(
    [],
  );

  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [selectedFilePreview, setSelectedFilePreview] = React.useState<
    string | null
  >(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [isOrderConfirmationOpen, setIsOrderConfirmationOpen] = React.useState(false);
  const [orderPdfUrl, setOrderPdfUrl] = React.useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = React.useState<number | null>(null);

  // Configured views state and defaults
  const [configuredViews, setConfiguredViews] = React.useState<ProductView[]>(["FRONT", "BACK", "RIGHT", "LEFT"]);
  const defaultViews: ProductView[] = ["FRONT", "BACK", "RIGHT", "LEFT"];

  const resetCustomizer = React.useCallback(() => {
    const firstView = configuredViews.length > 0 ? configuredViews[0] : "FRONT";
    setSelectedView(firstView as ProductView);
    setSelectedColor(colorParam || (availableColors.length > 0 ? availableColors[0] : "white"));
    
    // Initialize customizations for all configured views
    const initialCustomizations: Record<ProductView, ViewCustomization[]> = {} as Record<ProductView, ViewCustomization[]>;
    const viewsToInitialize = configuredViews.length > 0 ? configuredViews : defaultViews;
    viewsToInitialize.forEach(view => {
      initialCustomizations[view] = [];
    });
    
    setHistory([initialCustomizations]);
    setHistoryIndex(0);
    setSelectedImageId(null);
    setSelectedFile(undefined);
    setSelectedFilePreview(null);
  }, [availableColors, colorParam, configuredViews, defaultViews]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };
  const [history, setHistory] = React.useState<Record<ProductView, ViewCustomization[]>[]>(() => [{
    FRONT: [],
    BACK: [],
    RIGHT: [],
    LEFT: [],
  }]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const viewCustomizations = history[historyIndex];

  const setViewCustomizations = React.useCallback((updater: React.SetStateAction<Record<ProductView, ViewCustomization[]>>) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      const currentCustomizations = prevHistory[historyIndex];
      const newCustomizations =
        typeof updater === 'function'
          ? (updater as (prevState: Record<ProductView, ViewCustomization[]>) => Record<ProductView, ViewCustomization[]>)(currentCustomizations)
          : updater;

      // Only add to history if there's actually a change
      if (JSON.stringify(newCustomizations) === JSON.stringify(currentCustomizations)) {
        return prevHistory;
      }

      newHistory.push(newCustomizations);
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);
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
  const [productImageUrl, setProductImageUrl] = React.useState<string | null>(null);
  const [isConfigLoading, setIsConfigLoading] = React.useState(true);
  const [designAreas, setDesignAreas] = React.useState<
    Record<ProductView, DesignArea>
  >({
    FRONT: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
    BACK: { x: 0.25, y: 0.3, width: 0.5, height: 0.3 },
    RIGHT: { x: 0.15, y: 0.3, width: 0.35, height: 0.3 },
    LEFT: { x: 0.5, y: 0.3, width: 0.35, height: 0.3 },
  });

  const designAreaRef = React.useRef<HTMLDivElement | null>(null);
  const svgContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/product-config.json");
        const config = await response.json();
        setProductConfig(config);
        setDesignAreas(config.designAreas);
      } catch (error) {
        console.error("Failed to load product config:", error);
      } finally {
        setIsConfigLoading(false);
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
      if (!productId) {
        console.log("No productId, skipping data load");
        return;
      }

      // Load product itself + all customizable products for switching
      const { data: productsData, error: productsError } = await supabase
        .from("Products")
        .select("id,name,category,price,image,customizable,rating,tag")
        .eq("customizable", true);

      if (!productsError && productsData && productsData.length > 0) {
        const typed = productsData as Product[];
        setProducts(typed);
        const current = typed.find((p) => String(p.id) === String(productId));
        setCurrentProduct(current || null);
      } else if (productsError) {
        console.error("Supabase load Products error:", productsError.message);
      } else if (!productsData || productsData.length === 0) {
        console.warn("No customizable products found in database");
      }

      // Load per-view variants (colors + base images)
      const { data: variantsData, error: variantsError } = await supabase
        .from("ProductVariants")
        .select("id,product_id,view,color,image_url")
        .eq("product_id", Number(productId));

      if (!variantsError && variantsData) {
        const typed = variantsData as ProductVariant[];
        setProductVariants(typed);
        console.log("Set productVariants to:", typed);

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
        // Ensure productVariants remains an array on error
        setProductVariants([]);
      }

      // Load previously uploaded images for this product (for all views)
      const { data: imagesData, error: imagesError } = await supabase
        .from("ProductImages")
        .select("id,product_id,view,image_url,created_at")
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

      // Load configured views from API (same as admin interface)
      try {
        const response = await fetch(`/api/admin/products/${productId}/views`);
        if (response.ok) {
          const data = await response.json();
          if (data.configuredViews && data.configuredViews.length > 0) {
            setConfiguredViews(data.configuredViews as ProductView[]);
            console.log("Loaded configured views:", data.configuredViews);
            
            // Ensure selected view is valid
            if (!data.configuredViews.includes(selectedView)) {
              setSelectedView(data.configuredViews[0] as ProductView);
            }
          }
        } else {
          console.warn("Failed to fetch configured views, using defaults");
        }
      } catch (error) {
        console.warn("Error fetching configured views, using defaults:", error);
      }
    };

    loadProductData();
  }, [productId]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleProductChange = (id: number) => {
    // Navigate to the same editor with a new product
    router.push(`/customize?productId=${id}&color=${selectedColor}`);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file securely
      const validation = await SecureFileValidator.validateFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid file');
        event.target.value = ''; // Clear the input
        return;
      }

      // Additional image dimension validation
      const dimensionValidation = await SecureFileValidator.validateImageDimensions(file, 4096, 4096);
      if (!dimensionValidation.isValid) {
        toast.error(dimensionValidation.error || 'Invalid image dimensions');
        event.target.value = ''; // Clear the input
        return;
      }

      setSelectedFile(file);

      // Create safe preview URL
      const blobUrl = SecureFileValidator.createSafePreviewUrl(file);
      setSelectedFilePreview(blobUrl);
      
      toast.success('Image validated successfully');
    } catch (error) {
      console.error('File validation error:', error);
      toast.error('Error validating file');
      event.target.value = ''; // Clear the input
    }
  };

  const handleAddImageToCanvas = () => {
    if (!selectedFile || !selectedFilePreview) return;

    const newImageId = `${selectedView}-${Date.now()}`;
    const img = new window.Image();
    img.src = selectedFilePreview;
    img.onload = () => {
      const area = designAreas[selectedView];
      const targetWidth = area.width * canvasSize.width;
      const targetHeight = area.height * canvasSize.height;

      const scale = getFitScale(
        img.width,
        img.height,
        targetWidth,
        targetHeight,
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

  const getFitScale = React.useCallback((
    imgWidth: number,
    imgHeight: number,
    canvasWidth: number,
    canvasHeight: number,
  ) => {
    const widthScale = canvasWidth / imgWidth;
    const heightScale = canvasHeight / imgHeight;
    return Math.min(widthScale, heightScale, 1);
  }, []);

  const handleSelectExistingImage = async (image: ProductImage) => {
    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const newImageId = `${selectedView}-${Date.now()}`;
      const img = new window.Image();
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        console.error("Failed to load image");
        alert("Failed to load image. Please try again.");
      };
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
          file: null,
          uploadedImageId: image.id,
          uploadedUrl: image.image_url,
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
      img.src = blobUrl;
    } catch (error) {
      console.error("Failed to load image:", error);
      alert("Failed to load image. Please try again.");
    }
  };

  const renderShirtSVG = React.useCallback((view: ProductView, color: string): string => {
    try {
      // Sanitize color input
      const sanitizedColor = isValidColor(color) ? color : '#000000';
      
      // 1. Try to find a specific variant image from DB
      const variantsToUse = productVariants;
      
      // Safety check - ensure we have valid variants
      if (!Array.isArray(variantsToUse) || variantsToUse.length === 0) {
        console.warn("No valid variants available, falling back to default SVG");
        // Fallback to productConfig SVG (recolorable)
        if (!productConfig) return "";

        const svgPaths = productConfig.svgs[view]
          .map((p) => 
            SecureSVGRenderer.createSecurePath(
              p.d || '',
              sanitizedColor,
              p.stroke || '',
              String(p.strokeWidth || '0')
            )
          )
          .join("");

        return SecureSVGRenderer.createSecureSVG(
          "0 0 300 400",
          svgPaths,
          { style: "width: 100%; height: 100%;" }
        );
      }

      // Try to find variant - use optional chaining for safety
      const variant = variantsToUse?.find?.(v => v.view === view && v.color === color);
      if (variant?.image_url) {
        // Create secure SVG wrapping the image
        const secureImage = SecureSVGRenderer.createSecureImage(
          variant.image_url,
          0, 0, 300, 400,
          "xMidYMid slice"
        );
        
        return SecureSVGRenderer.createSecureSVG(
          "0 0 300 400",
          secureImage,
          { style: "width: 100%; height: 100%;" }
        );
      }

      // 2. Fallback to productConfig SVG (recolorable)
      if (!productConfig) return "";

      const svgPaths = productConfig.svgs[view]
        .map((p) => 
          SecureSVGRenderer.createSecurePath(
            p.d || '',
            sanitizedColor,
            p.stroke || '',
            String(p.strokeWidth || '0')
          )
        )
        .join("");

      return SecureSVGRenderer.createSecureSVG(
        "0 0 300 400",
        svgPaths,
        { style: "width: 100%; height: 100%;" }
      );
    } catch (error) {
      console.error("Error in renderShirtSVG:", error);
      return "";
    }
  }, [productConfig, productVariants]);

  const generatePDF = React.useCallback(async (): Promise<Blob | null> => {
    

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
          // Draw product image background
          if (productImageUrl) {
            const productImg = new window.Image();
            productImg.crossOrigin = "anonymous";
            
            await new Promise<void>((resolve) => {
              productImg.onload = () => {
                ctx.drawImage(productImg, 0, 0, canvasWidth, canvasHeight);
                resolve();
              };
              productImg.onerror = () => {
                console.error('Failed to load product image for PDF:', productImageUrl);
                // Fallback to SVG if image fails
                const svgImg = new window.Image();
                const svgBlob = new Blob([renderShirtSVG(view, selectedColor)], {
                  type: "image/svg+xml",
                });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                svgImg.onload = () => {
                  ctx.drawImage(svgImg, 0, 0, canvasWidth, canvasHeight);
                  URL.revokeObjectURL(svgUrl);
                  resolve();
                };
                svgImg.src = svgUrl;
              };
              productImg.src = productImageUrl;
            });
          } else {
            // Fallback to SVG when no image is available
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
          }

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

                  // To get the correct final scale, we must consider the user's modifications
                  // relative to the initial auto-scale.
                  // The cust.scale is the definitive scale factor applied on the screen.
                  // We can use it directly, as the drawing context is scaled relative to the
                  // PDF canvas, just as the on-screen canvas is.
                  const finalScale = cust.scale;

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
  }, [productId, currentProduct, selectedColor, renderShirtSVG, viewCustomizations, designAreas, canvasSize, getFitScale, productImageUrl]);


  const handleOrder = React.useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to place an order.");
      router.push("/login?redirect=/customize");
      return;
    }

    // Debug: Log authentication state
    console.log("User session:", session);
    console.log("User ID:", session.user.id);
    console.log("User email:", session.user.email);

    const orderToast = toast.loading('Starting your order...');

    try {
      setIsGeneratingPDF(true);

      toast.loading('Generating PDF...', { id: orderToast });
      const pdfBlob = await generatePDF();

      if (!pdfBlob) {
        toast.error('Failed to generate PDF. Please try again.', { id: orderToast });
        return;
      }
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setOrderPdfUrl(pdfUrl);

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
      
      // Upload to Supabase Storage with public access
      toast.loading('Uploading order files...', { id: orderToast });
      const fileName = `order-${Date.now()}-${productId}.zip`;
      
      // Try upload with public bucket policy
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('orders')
        .upload(fileName, zipBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Fallback: Try uploading to public bucket or use base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1]; // Remove data:application/zip;base64,
            resolve(base64Data);
          };
          reader.readAsDataURL(zipBlob);
        });
        
        const fileUrl = `data:application/zip;base64,${base64}`;
        console.log('Using base64 fallback for order file');
        
        // Skip storage upload and go directly to order creation
        const { data: orderData, error: orderError } = await supabase
          .from('Order')
          .insert({
            user_id: session.user.id,
            product_id: productId ? Number(productId) : null,
            file_url: fileUrl,
            status: 'pending_confirmation',
            total_price: 0
          })
          .select()
          .single();

        if (orderError) {
          throw new Error(`Order creation failed: ${orderError.message}`);
        }

        setCurrentOrderId(orderData.id);
        setIsOrderConfirmationOpen(true);
        toast.success('Order created! Please confirm PDF.', { id: orderToast });
        setIsGeneratingPDF(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('orders').getPublicUrl(fileName);
      const fileUrl = publicUrlData.publicUrl;

      // Create Order Entry with correct schema
      toast.loading('Creating order...', { id: orderToast });
      
      // First create the main order
      const { data: orderData, error: orderError } = await supabase
        .from('Order')
        .insert({
          user_id: session.user.id, // UUID from auth session
          file_url: fileUrl,
          status: 'pending_confirmation',
          total_price: currentProduct?.price || 0 // Use actual product price
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }

      // Handle different product types
      if (currentProduct?.customizable) {
        // Customizable product: Create order item with customizations
        const { data: orderItemData, error: orderItemError } = await supabase
          .from('OrderItems')
          .insert({
            order_id: orderData.id,
            product_id: productId ? Number(productId) : null,
            quantity: 1,
            unit_price: currentProduct?.price || 0,
            customization: JSON.stringify(viewCustomizations), // Store customizations as JSON
            design_file_url: fileUrl
          })
          .select()
          .single();

        if (orderItemError) {
          throw new Error(`Order item creation failed: ${orderItemError.message}`);
        }
      } else {
        // Non-customizable product: Create simple order item
        const { data: orderItemData, error: orderItemError } = await supabase
          .from('OrderItems')
          .insert({
            order_id: orderData.id,
            product_id: productId ? Number(productId) : null,
            quantity: 1,
            unit_price: currentProduct?.price || 0,
            customization: null, // No customizations for non-customizable products
            design_file_url: null // No design file needed
          })
          .select()
          .single();

        if (orderItemError) {
          throw new Error(`Order item creation failed: ${orderItemError.message}`);
        }
      }

      setCurrentOrderId(orderData.id);
      setIsOrderConfirmationOpen(true);

      toast.success('Order created! Please confirm PDF.', { id: orderToast });

    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || 'An error occurred.', { id: orderToast });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [productId, currentProduct, viewCustomizations, generatePDF, router]);

  const handleConfirmOrder = () => {
    setIsOrderConfirmationOpen(false);
    if (currentOrderId) {
      router.push(`/checkout?orderId=${currentOrderId}`);
    }
  };

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
      if (svgContainerRef.current) {
        const rect = svgContainerRef.current.getBoundingClientRect();
        // Calculate the actual design area dimensions based on SVG container size
        const area = designAreas[selectedView];
        const designAreaWidth = rect.width * area.width;
        const designAreaHeight = rect.height * area.height;
        setCanvasSize({ width: designAreaWidth, height: designAreaHeight });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [selectedView, designAreas]);

  // Get product image URL for current view and color
  React.useEffect(() => {
    const getProductImageUrl = () => {
      // First try to find a variant image for the current view and color
      const variant = productVariants.find(
        v => v.view === selectedView && v.color.toLowerCase() === selectedColor.toLowerCase()
      );
      
      if (variant?.image_url) {
        const validatedUrl = SecureSVGRenderer.validateImageURL(variant.image_url);
        if (validatedUrl) {
          setProductImageUrl(validatedUrl);
          return;
        }
      }
      
      // Fallback to product default image
      if (currentProduct?.image) {
        const validatedUrl = SecureSVGRenderer.validateImageURL(currentProduct.image);
        if (validatedUrl) {
          setProductImageUrl(validatedUrl);
          return;
        }
      }
      
      // No valid image found
      setProductImageUrl(null);
    };

    getProductImageUrl();
  }, [selectedView, selectedColor, productVariants, currentProduct]);

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
            if (!node || !image) return;

            let scaleX = node.scaleX();
            const rotation = node.rotation();
            const newX = node.x() / areaWidth;
            const newY = node.y() / areaHeight;

            const imageWidth = image.width * scaleX;
            const imageHeight = image.height * scaleX;

            const maxScaleX = areaWidth / image.width;
            const maxScaleY = areaHeight / image.height;
            const maxScale = Math.min(maxScaleX, maxScaleY);

            if (scaleX > maxScale) {
              scaleX = maxScale;
              node.scaleX(scaleX);
              node.scaleY(scaleX);
            }

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

  // Use configured views if available, otherwise fallback to default
  const productViews: ProductView[] = configuredViews.length > 0 ? configuredViews : defaultViews;

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

  if (isConfigLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f5f3f0]">
        <div className="text-gray-600">Loading configuration...</div>
      </div>
    );
  }

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
        isUploading={false}
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
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />

        {/* Central Display Area */}
        <main className="flex-1 flex items-center justify-center bg-[#f5f3f0] p-8 overflow-auto">
          <div className="relative w-full h-full max-w-2xl flex items-center justify-center">
            {/* T-shirt Display */}
            <div className="relative w-full max-w-md flex items-center justify-center">
              {/* Product Image - Direct display with validation */}
              <div
                ref={svgContainerRef}
                className="relative w-full h-auto"
                style={{ maxHeight: '600px' }}
              >
                {productImageUrl ? (
                  <img
                    src={productImageUrl}
                    alt={`${currentProduct?.name || 'Product'} - ${selectedView} view in ${selectedColor}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Product image failed to load:', productImageUrl);
                      setProductImageUrl(null);
                    }}
                  />
                ) : (
                  /* Fallback SVG when no image is available */
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderShirtSVG(selectedView, selectedColor),
                    }}
                  />
                )}
              </div>

              {/* Konva Canvas for design area - overlays SVG */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              >
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
        viewCustomizations={viewCustomizations}
      />

      <Dialog open={isOrderConfirmationOpen} onOpenChange={setIsOrderConfirmationOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Order Confirmation</DialogTitle>
            <DialogDescription>
              Your design has been saved! Please review the PDF below before proceeding to checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {orderPdfUrl && (
              <iframe
                src={orderPdfUrl}
                className="w-full h-[400px] border rounded-md"
                title="Design Preview"
              />
            )}
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsOrderConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmOrder}>
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Cleanup effect for blob URLs
  React.useEffect(() => {
    return () => {
      // Cleanup preview URL
      if (selectedFilePreview) {
        SecureFileValidator.revokePreviewUrl(selectedFilePreview);
      }
      
      // Cleanup all blob URLs in customizations
      Object.values(viewCustomizations).forEach(customizations => {
        customizations.forEach(customization => {
          if (customization.blobUrl) {
            SecureFileValidator.revokePreviewUrl(customization.blobUrl);
          }
        });
      });
    };
  }, [selectedFilePreview, viewCustomizations]);
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
