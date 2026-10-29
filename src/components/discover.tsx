"use client";
import {useNow} from '@/lib/use-now';
import Link from 'next/link';
import { useId, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  ArrowDown,
  ArrowUpRight,
  SlidersHorizontal,
  Sparkles,
  Flame,
  CalendarDays,
  MapPin,
  X,
} from "lucide-react";
import type { Event, Category } from "@/lib/types";
import { upcoming, inPeriod, day } from "@/lib/dates";
import { EventCard } from "./event-card";
import {forChildren} from '@/lib/event-discovery';
import { CategoryIcon } from "./category-icon";
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
      <section className="hero shell">
        <div className="hero-copy">
          <span className="live-label">
            <i /> A CIDADE NÃO PARA. VOCÊ TAMBÉM NÃO.
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
          <a className="button lime-button" href="#explorar">
            Bora descobrir <ArrowDown size={18} />
          </a>
          <div className="hero-note">
            <MapPin size={15} /> Seu próximo encontro começa aqui.
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="poster">
            <span>
              IPATINGA
              <br />
              FORA DO ÓBVIO
            </span>
            <div className="poster-title">
              VIVA
              <br />
              <em>A SUA</em>
              <br />
              CIDADE<span>↗</span>
            </div>
            <div className="poster-bottom">
              MÚSICA. CULTURA. ENCONTROS.
              <br />
              <b>O PRÓXIMO ROLÊ É SEU.</b>
            </div>
          </div>
          <div className="floating-sticker">
            <Sparkles size={22} /> tem rolê
            <br />
            <b>pra todo mundo.</b>
          </div>
          <div className="starburst">✳</div>
        </div>
      </section>
      <div className="ticker">
        <span>MENOS ROTINA</span> ✳ <span>MAIS HISTÓRIAS</span> ✳{" "}
        <span>VIVA IPATINGA</span> ✳ <span>ENCONTRE SUA TURMA</span> ✳{" "}
        <span>MAIS ROLÊS</span>
      </div>
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
        <p className="muted" role="status">Data da agenda: {day(new Date(now)).split('-').reverse().join('/')} · Brasília</p>
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
              onClick={() => setPeriod(v)}
            >
              {t}
            </button>
          ))}
          <button
            className={price === "free" ? "active" : ""}
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
