import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';

export default function ShadcnIslandDemo() {
  const [selection, setSelection] = useState('ready');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <Card
      data-test-id="shadcn-island"
      data-hydrated={isHydrated ? 'true' : 'false'}
      className="mb-6"
    >
      <CardHeader>
        <CardTitle>shadcn interaktive overlay-primitiver</CardTitle>
        <CardDescription>
          React-island som demonstrerer Dialog, DropdownMenu, Tabs og andre
          shadcn-komponenter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs Demo */}
        <Tabs defaultValue="overview" data-test-id="tabs-demo">
          <TabsList>
            <TabsTrigger value="overview" data-test-id="tab-trigger-overview">
              Oversikt
            </TabsTrigger>
            <TabsTrigger
              value="components"
              data-test-id="tab-trigger-components"
            >
              Komponenter
            </TabsTrigger>
            <TabsTrigger
              value="interactions"
              data-test-id="tab-trigger-interactions"
            >
              Interaksjoner
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="overview"
            data-test-id="tab-content-overview"
            className="mt-4"
          >
            <p className="m-0 text-sm text-(--color-text-secondary)">
              Denne demoen viser Dialog-, DropdownMenu- og Tabs-primitiver fra
              shadcn, integrert som React-islands i en Astro-applikasjon.
            </p>
          </TabsContent>
          <TabsContent
            value="components"
            data-test-id="tab-content-components"
            className="mt-4"
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" data-test-id="badge-default">
                Standard-merke
              </Badge>
              <Badge variant="secondary" data-test-id="badge-secondary">
                Sekundar
              </Badge>
              <Badge variant="outline" data-test-id="badge-outline">
                Omriss
              </Badge>
              <Badge variant="destructive">Destruktiv</Badge>
            </div>
          </TabsContent>
          <TabsContent
            value="interactions"
            data-test-id="tab-content-interactions"
            className="mt-4 space-y-3"
          >
            {/* Dialog Demo */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-test-id="dialog-trigger">
                  Åpne dialog
                </Button>
              </DialogTrigger>
              <DialogContent data-test-id="dialog-content">
                <DialogHeader>
                  <DialogTitle data-test-id="dialog-title">
                    Eksempeldialog
                  </DialogTitle>
                  <DialogDescription data-test-id="dialog-description">
                    Dette er en modal dialog som viser tastaturnavigasjon og
                    overlay-adferd. Trykk Escape for å lukke.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-(--color-text-secondary)">
                    Dialoginnhold vises her. Du kan plassere skjemaer,
                    bekreftelser eller annet interaktivt innhold.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-test-id="dialog-cancel"
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={() => setDialogOpen(false)}
                    data-test-id="dialog-confirm"
                  >
                    Bekreft
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* DropdownMenu Demo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-test-id="dropdown-trigger">
                  Åpne meny
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-test-id="dropdown-content">
                <DropdownMenuLabel>Menyvalg</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-test-id="dropdown-item-view">
                  Se detaljer
                </DropdownMenuItem>
                <DropdownMenuItem data-test-id="dropdown-item-edit">
                  Rediger arrangement
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  data-test-id="dropdown-item-delete"
                >
                  Slett
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsContent>
        </Tabs>

        <Separator data-test-id="separator" />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <p className="m-0 text-sm text-(--color-text-secondary)">
            Skjemakontroller med valgt status
          </p>
          <Select value={selection} onValueChange={setSelection}>
            <SelectTrigger aria-label="Shadcn-status" className="w-44">
              <SelectValue placeholder="Velg status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ready">Klar</SelectItem>
              <SelectItem value="in-progress">Pågår</SelectItem>
              <SelectItem value="done">Ferdig</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button">
            Shadcn {selection === 'ready' ? 'Klar' : 'Konfigurert'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
