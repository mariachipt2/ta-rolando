"use client";
import {useNow} from '@/lib/use-now';
import Link from 'next/link';
import { useId, useMemo, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUpRight,
  SlidersHorizontal,
  Sparkles,
  Flame,
  CalendarDays,
  X,
} from "lucide-react";
import type { Event, Category } from "@/lib/types";
import { upcoming, inPeriod, day, displayDate } from "@/lib/dates";
import { EventCard } from "./event-card";
import {forChildren} from '@/lib/event-discovery';
import { CategoryIcon } from "./category-icon";

function HeroEvent({ event }: { event: Event }) {
  const cover = event.cover_url || event.gallery?.[0];
  const [failed, setFailed] = useState(false);
  return (
    <Link href={"/evento/" + event.slug} className="home-spotlight">
      <div className="home-spotlight-art">
        {cover && !failed ? (
          <img src={cover} alt="" decoding="async" onError={() => setFailed(true)} />
        ) : <CalendarDays size={46} aria-hidden="true" />}
      </div>
      <div className="home-spotlight-copy">
        <span className="eyebrow">{event.featured ? "Em destaque" : "Na agenda"}</span>
        <strong>{event.title}</strong>
        <span className="home-spotlight-date">{displayDate(event.starts_at)}</span>
        <span className="home-spotlight-action">Ver evento <ArrowUpRight size={16} /></span>
      </div>
    </Link>
  );
}

function HomeSpotlight({ events }: { events: Event[] }) {
  const [selected, setSelected] = useState(0);
  const reduceMotion = useReducedMotion();
  const index = Math.min(selected, events.length - 1);
  const event = events[index];
  if (!event) return null;

  const move = (step: number) => {
    setSelected((index + step + events.length) % events.length);
  };

  return (
    <section className="home-spotlight-panel" aria-label="Eventos em destaque">
      <LazyMotion features={domAnimation} strict>
        <m.div
          key={event.id}
          initial={reduceMotion ? false : { opacity: 0.6, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
        >
          <HeroEvent event={event} />
        </m.div>
      </LazyMotion>
      {events.length > 1 && (
        <div className="home-spotlight-controls">
          <span aria-live="polite" aria-atomic="true">
            {index + 1} de {events.length}
            <span className="home-spotlight-announcement">: {event.title}</span>
          </span>
          <button type="button" aria-label="Destaque anterior" onClick={() => move(-1)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Próximo destaque" onClick={() => move(1)}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
export function Discover({
  events,
  categories,
  error,
}: {
  events: Event[];
  categories: Category[];
  error: boolean;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [period, setPeriod] = useState("all"),
    [price, setPrice] = useState("all"),
    [place, setPlace] = useState(""),
    [date, setDate] = useState(""),
    [childrenOnly,setChildrenOnly]=useState(false),
    [filters, setFilters] = useState(false),
    [limits, setLimits] = useState<Record<string, number>>({});
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoryPanelId = useId();
  const categoryTrigger = useRef<HTMLButtonElement>(null);
  const selectedCategory = categories.find(c => c.id === category);
  const selectCategory = (id: string) => {
    setCategory(id);
    setCategoriesOpen(false);
    categoryTrigger.current?.focus();
  };
  const now=useNow();
  const active = !!(
    childrenOnly ||
    query ||
    category ||
    period !== "all" ||
    price !== "all" ||
    place ||
    date
  );
  const future = useMemo(
    () => events.filter((e) => upcoming(e,new Date(now)) && e.status !== "cancelled"),
    [events,now],
  );
  const filtered = future.filter(
    (e) =>
      (!query ||
        e.title
          .toLocaleLowerCase("pt-BR")
          .includes(query.toLocaleLowerCase("pt-BR"))) &&
      (!childrenOnly || forChildren(e)) &&
      (!category || e.category_id === category) &&
      (period === "all" || inPeriod(e.starts_at, e.ends_at, period,new Date(now))) &&
      (price === "all" || e.is_free === (price === "free")) &&
      (!place ||
        `${e.venue_name} ${e.neighborhood}`
          .toLowerCase()
          .includes(place.toLowerCase())) &&
      (!date ||
        (day(e.starts_at) <= date && day(e.ends_at || e.starts_at) >= date)),
  );
  const spotlight = useMemo(() => {
    const hasCover = (event: Event) => Boolean(event.cover_url || event.gallery?.[0]);
    return [...future].sort((a, b) =>
      Number(b.featured && hasCover(b)) - Number(a.featured && hasCover(a)) ||
      Number(hasCover(b)) - Number(hasCover(a)) ||
      Date.parse(a.starts_at) - Date.parse(b.starts_at)
    ).slice(0, 4);
  }, [future]);
  const ranking = [...future]
    .sort(
      (a, b) =>
        b.interest_count - a.interest_count ||
        a.starts_at.localeCompare(b.starts_at),
    )
    .filter((e) => e.interest_count > 0);
  const clear = () => {
    setChildrenOnly(false);
    setQuery("");
    setCategory("");
    setPeriod("all");
    setPrice("all");
    setPlace("");
    setDate("");
  };
  const section = (
    title: string,
    subtitle: string,
    list: Event[],
    id?: string,
    rank = false,
  ) => (
    <section className="event-section" id={id} key={title}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">{subtitle}</span>
          <h2>{title}</h2>
        </div>
        <span className="count-pill">
          {list.length} {list.length === 1 ? "rolê" : "rolês"}
        </span>
      </div>
      {list.length ? (
        <div className="event-grid">
          {list.slice(0, rank ? 10 : limits[title] || 6).map((e, i) => (
            <EventCard key={e.id} event={e} rank={rank ? i + 1 : undefined} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <CalendarDays size={27} />
          <div>
            <h3>A próxima boa história ainda vem aí.</h3>
            <p>
              Nenhum evento nesta seleção por enquanto. Volte para descobrir
              novos rolês.
            </p>
          </div>
        </div>
      )}
      {!rank && list.length > (limits[title] || 6) && (
        <button
          className="button secondary load-more"
          onClick={() =>
            setLimits({ ...limits, [title]: (limits[title] || 6) + 6 })
          }
        >
          Mostrar mais eventos
        </button>
      )}
    </section>
  );
  return (
    <>
      <section className="hero shell home-hero">
        <div className="hero-copy">
          <span className="live-label">
            <i /> AGENDA DE IPATINGA
          </span>
          <h1>
            O que tá rolando
            <br />
            em{" "}
            <span>
              Ipatinga<span className="lime">?</span>
            </span>
          </h1>
          <p>
            Shows, festas, cultura, esportes, feiras e tudo que movimenta a
            cidade. <strong>Descubra seu próximo rolê!</strong>
          </p>
          <div className="home-hero-actions">
            <a className="button lime-button" href="#explorar">
              Explorar eventos <ArrowDown size={18} />
            </a>
            <Link href="/fim-de-semana" className="button secondary">
              Fim de semana <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <HomeSpotlight events={spotlight} />
      </section>
      <div className="shell discovery" id="explorar">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A CIDADE É SUA</span>
            <h2><span className="discovery-normal-title">Qual é a boa?</span><span className="discovery-theme-title">Encontre seu próximo <span>rolê.</span></span></h2>
          </div>
          <a href="#bombando" className="text-link">
            <Flame size={17} /> Tá bombando <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="search-row">
          <label className="search">
            <Search size={21} />
            <input
              aria-label="Pesquisar evento"
              placeholder="Busque seu próximo rolê..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button
            className={"button secondary " + (filters ? "selected" : "")}
            onClick={() => setFilters(!filters)}
            aria-expanded={filters}
          >
            <SlidersHorizontal size={18} /> Filtros
          </button>
        </div>
        <div className="discovery-categories" id="categorias" onKeyDown={e => {
          if (e.key === 'Escape' && categoriesOpen) {
            setCategoriesOpen(false);
            categoryTrigger.current?.focus();
          }
        }}>
          <button ref={categoryTrigger} className="category-toggle" aria-expanded={categoriesOpen} aria-controls={categoryPanelId} onClick={() => setCategoriesOpen(!categoriesOpen)}>
            {selectedCategory ? <CategoryIcon name={selectedCategory.icon} /> : <Sparkles size={20} />}
            <span><small>Tipo de rolê</small>{selectedCategory?.name || 'Todos os rolês'}</span>
            <ChevronDown size={18} className="category-chevron" />
          </button>
        <div className="category-list" id={categoryPanelId} hidden={!categoriesOpen}>
          <button
            className={!category ? "selected" : ""}
            aria-pressed={!category}
            onClick={() => selectCategory("")}
          >
            <Sparkles size={20} /> Todos os rolês
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={category === c.id ? "selected" : ""}
              aria-pressed={category === c.id}
              onClick={() => selectCategory(c.id)}
            >
              <CategoryIcon name={c.icon} />
              {c.name}
            </button>
          ))}
        </div>
        </div>
          <div className="period-list">
          {[
            ["all", "Qualquer dia"],
            ["today", "Hoje"],
            ["tomorrow", "Amanhã"],
            ["weekend", "Fim de semana"],
            ["week", "Próximos 7 dias"],
          ].map(([v, t]) => (
            <button
              key={v}
              className={period === v ? "active" : ""}
              aria-pressed={period === v}
              onClick={() => setPeriod(v)}
            >
              {t}
            </button>
          ))}
          <button
            className={price === "free" ? "active" : ""}
            aria-pressed={price === "free"}
            onClick={() => setPrice(price === "free" ? "all" : "free")}
          >
            ✦ Gratuitos
          </button>
        </div>
        <div className="family-filter"><button className={'button secondary '+(childrenOnly?'selected':'')} aria-pressed={childrenOnly} onClick={()=>setChildrenOnly(!childrenOnly)}>Para crianças</button>{childrenOnly&&<small>Somente eventos informados como adequados para crianças. Confira também a classificação indicativa.</small>}</div>
        {filters && (
          <div className="filter-panel">
            <label>
              Data
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              Local ou bairro
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Ex.: Centro"
              />
            </label>
            <label>
              Entrada
              <select value={price} onChange={(e) => setPrice(e.target.value)}>
                <option value="all">Todas</option>
                <option value="free">Gratuitos</option>
                <option value="paid">Pagos</option>
              </select>
            </label>
          </div>
        )}
        {error && (
          <p role="alert" className="notice">
            Não conseguimos consultar os eventos agora. Recarregue a página em
            alguns instantes.
          </p>
        )}
        {active ? (
          <>
            <button className="clear" onClick={clear}>
              <X size={15} /> Limpar filtros
            </button>
            {section("Seu próximo rolê", "RESULTADOS DA BUSCA", filtered)}
          </>
        ) : (
          <>
            {future.some((e) => e.featured) &&
              section(
                "Vale colocar na agenda",
                "DESTAQUES DA CIDADE",
                future.filter((e) => e.featured),
              )}
            {section("Próximos eventos", "JÁ VAI SE PROGRAMANDO", future)}
            {section(
              "Tá rolando hoje",
              "APROVEITE O AGORA",
              future.filter((e) => inPeriod(e.starts_at, e.ends_at, "today",new Date(now))),
            )}
            {section(
              "Vai rolar amanhã",
              "GUARDE UM ESPAÇO NA AGENDA",
              future.filter((e) =>
                inPeriod(e.starts_at, e.ends_at, "tomorrow",new Date(now)),
              ),
            )}
            {section(
              "Rolês do fim de semana",
              "SAIA DA ROTINA",
              future.filter((e) => inPeriod(e.starts_at, e.ends_at, "weekend",new Date(now))),
            )}
            <div className="agenda-banner">
              <div>
                <span className="eyebrow">SEUS PLANOS, DO SEU JEITO</span>
                <h2>Curtiu? Marca “Eu vou!”.</h2>
                <p>Seu rolê salvo na agenda, sem cadastro e sem complicação.</p>
              </div>
              <Link href="/agenda" className="button lime-button">
                Minha agenda <ArrowUpRight size={18} />
              </Link>
            </div>
            {section(
              "Eventos gratuitos",
              "BOAS HISTÓRIAS NÃO PRECISAM CUSTAR",
              future.filter((e) => e.is_free),
            )}
            {section(
              "Tá Bombando!",
              "OS ROLÊS QUE A GALERA QUER",
              ranking.slice(0, 3),
              "bombando",
            )}
            {section(
              "Top 10 mais aguardados",
              "IPATINGA JÁ ESTÁ FAZENDO PLANOS",
              ranking.slice(0, 10),
              "top10",
              true,
            )}
          </>
        )}
      </div>
    </>
  );
}
