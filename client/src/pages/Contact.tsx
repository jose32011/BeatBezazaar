import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, Mail, Phone, MapPin, Send } from "lucide-react";
import { useAppBranding } from "@/hooks/useAppBranding";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";

interface SocialMediaSettings {
  facebookUrl: string;
  instagramUrl: string;
}

interface ContactSettings {
  bandImageUrl: string;
  bandName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactCity: string;
  contactState: string;
  contactZipCode: string;
  contactCountry: string;
  messageEnabled: boolean;
  messageSubject: string;
  messageTemplate: string;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function Contact() {
  const { toast } = useToast();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { appName } = useAppBranding();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch social media settings
  const { data: socialSettings } = useQuery<SocialMediaSettings>({
    queryKey: ["social-media-settings"],
    queryFn: async () => {
      const response = await fetch("/api/social-media-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch social media settings");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch contact settings
  const { data: contactSettings } = useQuery<ContactSettings>({
    queryKey: ["contact-settings"],
    queryFn: async () => {
      const response = await fetch("/api/contact-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch contact settings");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "Thank you for contacting us. We'll get back to you soon.",
        });
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: themeColors.background,
        color: themeColors.foreground
      }}
    >
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Band Poster Image */}
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="w-48 h-48 mx-auto rounded-lg overflow-hidden border-4 shadow-2xl"
                 style={{ borderColor: themeColors.border }}>
              <img
                src={contactSettings?.bandImageUrl || "/api/placeholder/192/192"}
                alt={`${contactSettings?.bandName || appName} Band`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%236366f1'/%3E%3Ctext x='96' y='105' text-anchor='middle' fill='white' font-size='36' font-family='Arial'%3E🎵%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 flex items-center justify-center"
                 style={{ borderColor: themeColors.background }}>
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          <h1 
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ color: themeColors.primary }}
          >
            Get In Touch
          </h1>
          <p 
            className="text-xl max-w-2xl mx-auto"
            style={{ color: themeColors.mutedForeground }}
          >
            We'd love to hear from you! Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card 
              className="backdrop-blur-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border
              }}
            >
              <CardHeader>
                <CardTitle 
                  className="text-2xl"
                  style={{ color: themeColors.foreground }}
                >
                  Contact Information
                </CardTitle>
                <CardDescription style={{ color: themeColors.mutedForeground }}>
                  Reach out to us through any of these channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${themeColors.primary}20` }}
                  >
                    <Mail className="h-6 w-6" style={{ color: themeColors.primary }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: themeColors.foreground }}>Email</p>
                    <p style={{ color: themeColors.mutedForeground }}>{contactSettings?.contactEmail || "contact@beatbazaar.com"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${themeColors.primary}20` }}
                  >
                    <Phone className="h-6 w-6" style={{ color: themeColors.primary }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: themeColors.foreground }}>Phone</p>
                    <p style={{ color: themeColors.mutedForeground }}>{contactSettings?.contactPhone || "+1 (555) 123-4567"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${themeColors.primary}20` }}
                  >
                    <MapPin className="h-6 w-6" style={{ color: themeColors.primary }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: themeColors.foreground }}>Address</p>
                    <p style={{ color: themeColors.mutedForeground }}>
                      {contactSettings?.contactAddress || "123 Music Street"}<br />
                      {contactSettings?.contactCity || "Los Angeles"}, {contactSettings?.contactState || "CA"} {contactSettings?.contactZipCode || "90210"}<br />
                      {contactSettings?.contactCountry || "USA"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Links */}
            <Card 
              className="backdrop-blur-sm"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border
              }}
            >
              <CardHeader>
                <CardTitle 
                  className="text-xl"
                  style={{ color: themeColors.foreground }}
                >
                  Follow Us
                </CardTitle>
                <CardDescription style={{ color: themeColors.mutedForeground }}>
                  Stay connected with our latest updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  {socialSettings?.facebookUrl && (
                    <Button
                      asChild
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                    >
                      <a
                        href={socialSettings.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2"
                      >
                        <Facebook className="h-5 w-5" />
                        <span>Facebook</span>
                      </a>
                    </Button>
                  )}
                  {socialSettings?.instagramUrl && (
                    <Button
                      asChild
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex-1"
                    >
                      <a
                        href={socialSettings.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2"
                      >
                        <Instagram className="h-5 w-5" />
                        <span>Instagram</span>
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card 
            className="backdrop-blur-sm"
            style={{
              backgroundColor: themeColors.card,
              borderColor: themeColors.border
            }}
          >
            <CardHeader>
              <CardTitle 
                className="text-2xl"
                style={{ color: themeColors.foreground }}
              >
                Send us a Message
              </CardTitle>
              <CardDescription style={{ color: themeColors.mutedForeground }}>
                Fill out the form below and we'll get back to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactSettings?.messageEnabled !== false ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" style={{ color: themeColors.foreground }}>Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={{
                        backgroundColor: themeColors.input,
                        borderColor: themeColors.border,
                        color: themeColors.foreground
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: themeColors.foreground }}>Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      style={{
                        backgroundColor: themeColors.input,
                        borderColor: themeColors.border,
                        color: themeColors.foreground
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" style={{ color: themeColors.foreground }}>Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="What's this about?"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    style={{
                      backgroundColor: themeColors.input,
                      borderColor: themeColors.border,
                      color: themeColors.foreground
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" style={{ color: themeColors.foreground }}>Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="resize-none"
                    style={{
                      backgroundColor: themeColors.input,
                      borderColor: themeColors.border,
                      color: themeColors.foreground
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
                  style={{
                    backgroundColor: themeColors.primary,
                    color: themeColors.primaryForeground
                  }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </div>
                  )}
                </Button>
              </form>
            ) : (
                <div className="text-center py-8">
                  <p style={{ color: themeColors.mutedForeground }}>
                    Contact form is currently disabled. Please use the contact information above to reach us.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Contact;
