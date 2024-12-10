--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO neondb_owner;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: sku_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.sku_type AS ENUM (
    'per_piece',
    'three_piece',
    'dozen'
);


ALTER TYPE public.sku_type OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: neondb_owner
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: neondb_owner
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: neondb_owner
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.customers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: loyalty_points; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loyalty_points (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.loyalty_points OWNER TO neondb_owner;

--
-- Name: loyalty_points_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.loyalty_points ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.loyalty_points_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loyalty_transactions (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    sale_id integer NOT NULL,
    points integer NOT NULL,
    type text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.loyalty_transactions OWNER TO neondb_owner;

--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.loyalty_transactions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.loyalty_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: product_suppliers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_suppliers (
    id integer NOT NULL,
    product_id integer NOT NULL,
    supplier_id integer NOT NULL,
    cost_price numeric(10,2) NOT NULL,
    is_preferred boolean DEFAULT false,
    last_supply_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_suppliers OWNER TO neondb_owner;

--
-- Name: product_suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.product_suppliers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_suppliers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    buying_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    category text,
    min_stock integer,
    max_stock integer,
    reorder_point integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    stock_unit public.sku_type DEFAULT 'per_piece'::public.sku_type NOT NULL,
    default_unit_pricing_id integer
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.products ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    buying_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.purchase_order_items OWNER TO neondb_owner;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.purchase_order_items ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.purchase_order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    supplier_id integer NOT NULL,
    user_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    received_date timestamp without time zone,
    total numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.purchase_orders OWNER TO neondb_owner;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.purchase_orders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.purchase_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    sku_pricing_id integer,
    unit_pricing_id integer
);


ALTER TABLE public.sale_items OWNER TO neondb_owner;

--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.sale_items ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sale_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    customer_id integer,
    user_id integer NOT NULL,
    total numeric(10,2) NOT NULL,
    payment_method text NOT NULL,
    payment_status text DEFAULT 'paid'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sales OWNER TO neondb_owner;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.sales ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sku_pricing; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sku_pricing (
    id integer NOT NULL,
    product_id integer NOT NULL,
    sku_type public.sku_type NOT NULL,
    buying_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sku_pricing OWNER TO neondb_owner;

--
-- Name: sku_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sku_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sku_pricing_id_seq OWNER TO neondb_owner;

--
-- Name: sku_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sku_pricing_id_seq OWNED BY public.sku_pricing.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.suppliers OWNER TO neondb_owner;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.suppliers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.suppliers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: unit_pricing; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.unit_pricing (
    id integer NOT NULL,
    product_id integer NOT NULL,
    unit_type text NOT NULL,
    quantity integer NOT NULL,
    buying_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.unit_pricing OWNER TO neondb_owner;

--
-- Name: unit_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.unit_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_pricing_id_seq OWNER TO neondb_owner;

--
-- Name: unit_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.unit_pricing_id_seq OWNED BY public.unit_pricing.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'cashier'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: sku_pricing id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sku_pricing ALTER COLUMN id SET DEFAULT nextval('public.sku_pricing_id_seq'::regclass);


--
-- Name: unit_pricing id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unit_pricing ALTER COLUMN id SET DEFAULT nextval('public.unit_pricing_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: neondb_owner
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	04d3a6fd762ca57db38768ad3d0ff300a3c5dab385d3bba2d0f448ddf525d523	1701676800000
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, name, email, phone, address, created_at, updated_at) FROM stdin;
1	Samuel Mbugua Nyambura	Samnmbuguah@gmail.com	0713087979	\N	2024-12-04 19:21:58.857	2024-12-04 19:21:58.873118
2	Samuel Mbugua Nyambura	Samnmbuguah@gmail.com	0713087979	\N	2024-12-04 19:27:49.682	2024-12-04 19:27:49.698399
3	Samuel Mbugua Nyambura	Samnmbuguah@gmail.com	0713087979	\N	2024-12-09 13:16:39.921	2024-12-09 13:16:39.957367
4	Samuel Mbugua Nyambura	Samnmbuguah@gmail.com	0713087979	\N	2024-12-09 13:27:30.436	2024-12-09 13:27:30.470876
\.


--
-- Data for Name: loyalty_points; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.loyalty_points (id, customer_id, points, created_at, updated_at) FROM stdin;
1	1	3	2024-12-04 19:22:13.385447	2024-12-04 19:22:13.385447
\.


--
-- Data for Name: loyalty_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.loyalty_transactions (id, customer_id, sale_id, points, type, created_at) FROM stdin;
1	1	2	3	earn	2024-12-04 19:22:13.459264
\.


--
-- Data for Name: product_suppliers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_suppliers (id, product_id, supplier_id, cost_price, is_preferred, last_supply_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, sku, buying_price, selling_price, stock, category, min_stock, max_stock, reorder_point, created_at, updated_at, stock_unit, default_unit_pricing_id) FROM stdin;
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, quantity, buying_price, selling_price, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_orders (id, supplier_id, user_id, status, order_date, received_date, total, created_at, updated_at) FROM stdin;
1	1	1	received	2024-12-04 19:21:10.87002	2024-12-04 19:21:15.147	570.00	2024-12-04 19:21:10.87002	2024-12-04 19:21:15.147
3	2	1	received	2024-12-05 08:24:56.020327	2024-12-05 08:25:09.634	450.00	2024-12-05 08:24:56.020327	2024-12-05 08:25:09.634
2	1	1	received	2024-12-04 19:30:49.310849	2024-12-05 08:25:56.716	57.00	2024-12-04 19:30:49.310849	2024-12-05 08:25:56.716
4	2	1	received	2024-12-09 15:31:43.71896	2024-12-09 16:34:04.453	83.33	2024-12-09 15:31:43.71896	2024-12-09 16:34:04.453
5	2	2	received	2024-12-09 17:32:36.755438	2024-12-09 17:32:42.127	9999.60	2024-12-09 17:32:36.755438	2024-12-09 17:32:42.127
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_items (id, sale_id, product_id, quantity, price, created_at, updated_at, sku_pricing_id, unit_pricing_id) FROM stdin;
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales (id, customer_id, user_id, total, payment_method, payment_status, created_at, updated_at) FROM stdin;
1	\N	1	303.00	cash	paid	2024-12-04 19:20:16.221515	2024-12-04 19:20:16.221515
2	1	1	303.00	cash	paid	2024-12-04 19:22:13.062007	2024-12-04 19:22:13.062007
3	\N	1	119.00	cash	paid	2024-12-04 19:29:54.689915	2024-12-04 19:29:54.689915
4	\N	2	210.00	cash	paid	2024-12-05 08:24:25.801458	2024-12-05 08:24:25.801458
5	\N	1	275.00	cash	paid	2024-12-05 08:28:04.689892	2024-12-05 08:28:04.689892
6	\N	2	363.00	cash	paid	2024-12-05 08:43:12.820459	2024-12-05 08:43:12.820459
7	\N	2	1279.00	cash	paid	2024-12-05 10:45:10.879403	2024-12-05 10:45:10.879403
8	\N	2	1140.00	mpesa	paid	2024-12-05 10:50:11.885752	2024-12-05 10:50:11.885752
9	\N	2	293.00	cash	paid	2024-12-06 17:50:25.989961	2024-12-06 17:50:25.989961
10	\N	1	813.00	cash	paid	2024-12-09 07:04:40.940734	2024-12-09 07:04:40.940734
11	\N	1	813.00	mpesa	paid	2024-12-09 07:04:46.704165	2024-12-09 07:04:46.704165
12	\N	1	813.00	cash	paid	2024-12-09 07:05:39.370169	2024-12-09 07:05:39.370169
13	\N	1	813.00	cash	paid	2024-12-09 07:05:59.765475	2024-12-09 07:05:59.765475
14	\N	1	291.00	cash	paid	2024-12-09 07:13:29.915862	2024-12-09 07:13:29.915862
15	\N	1	293.00	mpesa	paid	2024-12-09 07:18:31.868493	2024-12-09 07:18:31.868493
16	\N	1	293.00	cash	paid	2024-12-09 07:35:17.638793	2024-12-09 07:35:17.638793
17	\N	1	213.00	cash	paid	2024-12-09 07:36:16.811128	2024-12-09 07:36:16.811128
18	\N	1	293.00	cash	paid	2024-12-09 07:56:25.058772	2024-12-09 07:56:25.058772
19	\N	1	293.00	cash	paid	2024-12-09 07:56:39.02202	2024-12-09 07:56:39.02202
20	\N	1	213.00	cash	paid	2024-12-09 10:04:15.183338	2024-12-09 10:04:15.183338
21	\N	1	213.00	cash	paid	2024-12-09 10:09:48.635219	2024-12-09 10:09:48.635219
22	\N	1	363.00	cash	paid	2024-12-09 10:15:42.70118	2024-12-09 10:15:42.70118
23	\N	1	293.00	cash	paid	2024-12-09 10:19:31.508209	2024-12-09 10:19:31.508209
24	\N	1	293.00	cash	paid	2024-12-09 10:24:31.439058	2024-12-09 10:24:31.439058
25	\N	1	363.00	mpesa	paid	2024-12-09 10:25:02.002327	2024-12-09 10:25:02.002327
26	\N	1	363.00	cash	paid	2024-12-09 10:31:25.243662	2024-12-09 10:31:25.243662
27	\N	1	293.00	cash	paid	2024-12-09 10:34:58.087623	2024-12-09 10:34:58.087623
28	\N	1	363.00	cash	paid	2024-12-09 10:35:31.858857	2024-12-09 10:35:31.858857
29	\N	1	363.00	cash	paid	2024-12-09 10:39:28.610987	2024-12-09 10:39:28.610987
30	\N	1	213.00	cash	paid	2024-12-09 10:39:57.106956	2024-12-09 10:39:57.106956
31	\N	1	213.00	cash	paid	2024-12-09 10:40:37.13364	2024-12-09 10:40:37.13364
32	\N	2	363.00	cash	paid	2024-12-09 10:49:23.571547	2024-12-09 10:49:23.571547
33	\N	2	363.00	mpesa	paid	2024-12-09 10:49:29.532145	2024-12-09 10:49:29.532145
34	\N	2	363.00	mpesa	paid	2024-12-09 10:49:46.419118	2024-12-09 10:49:46.419118
35	\N	1	293.00	cash	paid	2024-12-09 12:56:13.584167	2024-12-09 12:56:13.584167
36	\N	1	293.00	cash	paid	2024-12-09 13:16:48.899332	2024-12-09 13:16:48.899332
37	\N	1	363.00	cash	paid	2024-12-09 13:17:30.804059	2024-12-09 13:17:30.804059
38	\N	1	213.00	cash	paid	2024-12-09 13:17:50.98601	2024-12-09 13:17:50.98601
39	\N	1	200.00	cash	paid	2024-12-09 13:20:22.480724	2024-12-09 13:20:22.480724
40	\N	1	221.00	cash	paid	2024-12-09 13:23:04.227938	2024-12-09 13:23:04.227938
41	\N	1	293.00	cash	paid	2024-12-09 13:23:44.83535	2024-12-09 13:23:44.83535
42	\N	1	363.00	cash	paid	2024-12-09 13:23:58.21136	2024-12-09 13:23:58.21136
43	\N	1	293.00	cash	paid	2024-12-09 13:25:11.282492	2024-12-09 13:25:11.282492
44	\N	1	363.00	mpesa	paid	2024-12-09 13:25:27.443137	2024-12-09 13:25:27.443137
45	\N	1	363.00	mpesa	paid	2024-12-09 13:25:55.521025	2024-12-09 13:25:55.521025
46	\N	1	221.00	cash	paid	2024-12-09 13:26:05.095038	2024-12-09 13:26:05.095038
47	\N	1	293.00	cash	paid	2024-12-09 13:26:14.917935	2024-12-09 13:26:14.917935
48	\N	1	298.00	cash	paid	2024-12-09 13:26:47.259475	2024-12-09 13:26:47.259475
49	\N	1	293.00	cash	paid	2024-12-09 13:32:09.353986	2024-12-09 13:32:09.353986
50	\N	1	363.00	cash	paid	2024-12-09 13:35:49.654628	2024-12-09 13:35:49.654628
51	\N	1	363.00	cash	paid	2024-12-09 13:40:16.282012	2024-12-09 13:40:16.282012
52	\N	1	298.00	cash	paid	2024-12-09 13:42:47.427662	2024-12-09 13:42:47.427662
53	\N	2	363.00	cash	paid	2024-12-09 13:58:24.683626	2024-12-09 13:58:24.683626
54	\N	2	363.00	mpesa	paid	2024-12-09 14:00:17.199569	2024-12-09 14:00:17.199569
55	\N	2	293.00	mpesa	paid	2024-12-09 14:13:03.942564	2024-12-09 14:13:03.942564
56	\N	2	293.00	cash	paid	2024-12-09 14:13:24.56274	2024-12-09 14:13:24.56274
57	\N	1	363.00	cash	paid	2024-12-09 14:39:28.372987	2024-12-09 14:39:28.372987
58	\N	1	213.00	cash	paid	2024-12-09 14:48:43.867343	2024-12-09 14:48:43.867343
59	\N	1	363.00	cash	paid	2024-12-09 14:59:38.672271	2024-12-09 14:59:38.672271
60	\N	1	363.00	cash	paid	2024-12-09 15:03:52.248178	2024-12-09 15:03:52.248178
61	\N	1	363.00	cash	paid	2024-12-09 15:05:11.209275	2024-12-09 15:05:11.209275
62	\N	1	441.00	cash	paid	2024-12-09 15:13:06.376004	2024-12-09 15:13:06.376004
63	\N	1	363.00	cash	paid	2024-12-09 15:13:34.071268	2024-12-09 15:13:34.071268
64	\N	1	298.00	cash	paid	2024-12-09 15:16:47.372956	2024-12-09 15:16:47.372956
65	\N	2	363.00	cash	paid	2024-12-09 15:21:44.139931	2024-12-09 15:21:44.139931
66	\N	2	363.00	cash	paid	2024-12-09 15:23:33.351602	2024-12-09 15:23:33.351602
67	\N	2	363.00	cash	paid	2024-12-09 15:26:11.582536	2024-12-09 15:26:11.582536
68	\N	1	363.00	cash	paid	2024-12-09 16:18:13.564783	2024-12-09 16:18:13.564783
69	\N	1	293.00	cash	paid	2024-12-09 16:19:09.230889	2024-12-09 16:19:09.230889
70	\N	1	228.00	mpesa	paid	2024-12-09 16:19:32.447835	2024-12-09 16:19:32.447835
71	\N	1	293.00	cash	paid	2024-12-09 16:22:36.034015	2024-12-09 16:22:36.034015
72	\N	2	135.00	cash	paid	2024-12-09 16:27:39.251002	2024-12-09 16:27:39.251002
73	\N	1	363.00	cash	paid	2024-12-09 16:35:42.159764	2024-12-09 16:35:42.159764
74	\N	1	293.00	cash	paid	2024-12-09 16:40:13.254829	2024-12-09 16:40:13.254829
75	\N	1	363.00	cash	paid	2024-12-09 16:42:10.575551	2024-12-09 16:42:10.575551
76	\N	1	363.00	cash	paid	2024-12-09 17:27:45.322211	2024-12-09 17:27:45.322211
77	\N	1	143.00	cash	paid	2024-12-09 17:28:07.151216	2024-12-09 17:28:07.151216
78	\N	1	293.00	cash	paid	2024-12-09 17:33:15.531588	2024-12-09 17:33:15.531588
79	\N	1	213.00	cash	paid	2024-12-09 17:49:17.084486	2024-12-09 17:49:17.084486
80	\N	1	293.00	cash	paid	2024-12-09 17:50:06.365734	2024-12-09 17:50:06.365734
81	\N	1	213.00	cash	paid	2024-12-09 17:57:03.259425	2024-12-09 17:57:03.259425
82	\N	1	363.00	cash	paid	2024-12-09 17:57:29.25296	2024-12-09 17:57:29.25296
83	\N	1	293.00	cash	paid	2024-12-09 17:57:54.230192	2024-12-09 17:57:54.230192
84	\N	1	363.00	cash	paid	2024-12-09 17:58:31.612034	2024-12-09 17:58:31.612034
85	\N	1	143.00	cash	paid	2024-12-09 17:59:16.54311	2024-12-09 17:59:16.54311
86	\N	1	363.00	cash	paid	2024-12-09 18:01:35.505853	2024-12-09 18:01:35.505853
87	\N	1	213.00	cash	paid	2024-12-09 18:05:39.043773	2024-12-09 18:05:39.043773
88	\N	1	228.00	cash	paid	2024-12-09 18:06:12.464663	2024-12-09 18:06:12.464663
89	\N	1	363.00	cash	paid	2024-12-09 18:08:45.09161	2024-12-09 18:08:45.09161
90	\N	1	293.00	cash	paid	2024-12-09 18:14:51.649601	2024-12-09 18:14:51.649601
91	\N	1	363.00	cash	paid	2024-12-09 18:15:58.46961	2024-12-09 18:15:58.46961
92	\N	1	213.00	cash	paid	2024-12-09 18:24:32.947724	2024-12-09 18:24:32.947724
93	\N	1	363.00	cash	paid	2024-12-09 18:27:01.400549	2024-12-09 18:27:01.400549
94	\N	1	435.00	cash	paid	2024-12-09 18:34:16.780493	2024-12-09 18:34:16.780493
95	\N	1	290.00	cash	paid	2024-12-09 18:35:17.23416	2024-12-09 18:35:17.23416
96	\N	1	213.00	cash	paid	2024-12-09 18:40:21.995506	2024-12-09 18:40:21.995506
97	\N	1	293.00	cash	paid	2024-12-09 18:49:32.74513	2024-12-09 18:49:32.74513
98	\N	1	213.00	cash	paid	2024-12-09 18:50:26.973016	2024-12-09 18:50:26.973016
99	\N	1	363.00	cash	paid	2024-12-09 19:07:19.118075	2024-12-09 19:07:19.118075
100	\N	1	363.00	cash	paid	2024-12-09 19:14:49.591645	2024-12-09 19:14:49.591645
101	\N	1	363.00	cash	paid	2024-12-09 19:26:21.673352	2024-12-09 19:26:21.673352
102	\N	1	221.00	cash	paid	2024-12-09 19:27:00.231737	2024-12-09 19:27:00.231737
103	\N	1	363.00	cash	paid	2024-12-09 19:29:14.045725	2024-12-09 19:29:14.045725
104	\N	1	293.00	cash	paid	2024-12-09 19:31:16.464849	2024-12-09 19:31:16.464849
105	\N	1	213.00	cash	paid	2024-12-09 19:31:35.671856	2024-12-09 19:31:35.671856
106	\N	1	143.00	cash	paid	2024-12-09 19:43:52.805828	2024-12-09 19:43:52.805828
107	\N	1	213.00	cash	paid	2024-12-09 19:50:57.439187	2024-12-09 19:50:57.439187
108	\N	2	135.00	cash	paid	2024-12-09 19:51:07.488105	2024-12-09 19:51:07.488105
109	\N	2	143.00	mpesa	paid	2024-12-09 19:51:47.653319	2024-12-09 19:51:47.653319
110	\N	2	228.00	mpesa	paid	2024-12-09 19:53:43.308779	2024-12-09 19:53:43.308779
111	\N	1	0.00	mpesa	paid	2024-12-10 09:04:10.769646	2024-12-10 09:04:10.769646
\.


--
-- Data for Name: sku_pricing; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sku_pricing (id, product_id, sku_type, buying_price, selling_price, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.suppliers (id, name, email, phone, address, created_at, updated_at) FROM stdin;
1	Samuel Mbugua Nyambura	Samnmbuguah@gmail.com	0713087979	P.O. BOX 14329	2024-12-04 19:19:25.798724	2024-12-04 19:19:25.798724
2	new supplier2	Samnmbuguah@gmail.com	0713087979	P.O. BOX 14329	2024-12-05 08:24:02.415651	2024-12-05 08:24:02.415651
\.


--
-- Data for Name: unit_pricing; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.unit_pricing (id, product_id, unit_type, quantity, buying_price, selling_price, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, username, password, role, created_at, updated_at) FROM stdin;
1	Samnmbuguah@prosale.com	Samnmbuguah	2f12c0ea35371457a1c142f689b7692b42fb119bfaa146ab3c96b2539348f2f49087a5b164852951fea42db3d272f07fa56e4a0b49533bb5a737a3cbf77b4f21.b15d51f6c28e633f2bac94b0b104c981	cashier	2024-12-04 19:18:49.833116	2024-12-04 19:18:49.833116
2	Lyz@prosale.com	Lyz	fb24b9e2d09c84ab9f0113751dfaad00080d0e8dc3921fc5660c24317fedee1d5cd088a3b89e516a27f8863a3694aa7aae6866c9213838073ea89a4977ef76c6.7cf19f0c7e76739fc6c775718f4d6ce6	cashier	2024-12-05 08:23:43.162331	2024-12-05 08:23:43.162331
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: neondb_owner
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 4, true);


--
-- Name: loyalty_points_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.loyalty_points_id_seq', 1, true);


--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.loyalty_transactions_id_seq', 1, true);


--
-- Name: product_suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_suppliers_id_seq', 2, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.products_id_seq', 13, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 5, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 5, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 349, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sales_id_seq', 111, true);


--
-- Name: sku_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sku_pricing_id_seq', 4, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 2, true);


--
-- Name: unit_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.unit_pricing_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: neondb_owner
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: loyalty_points loyalty_points_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: product_suppliers product_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: sku_pricing sku_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sku_pricing
    ADD CONSTRAINT sku_pricing_pkey PRIMARY KEY (id);


--
-- Name: sku_pricing sku_pricing_product_id_sku_type_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sku_pricing
    ADD CONSTRAINT sku_pricing_product_id_sku_type_key UNIQUE (product_id, sku_type);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: unit_pricing unit_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.unit_pricing
    ADD CONSTRAINT unit_pricing_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_unit_pricing_is_default; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_unit_pricing_is_default ON public.unit_pricing USING btree (is_default) WHERE (is_default = true);


--
-- Name: idx_unit_pricing_product_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_unit_pricing_product_id ON public.unit_pricing USING btree (product_id);


--
-- Name: loyalty_points loyalty_points_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: loyalty_transactions loyalty_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: loyalty_transactions loyalty_transactions_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: product_suppliers product_suppliers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_suppliers product_suppliers_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: products products_default_unit_pricing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_default_unit_pricing_id_fkey FOREIGN KEY (default_unit_pricing_id) REFERENCES public.unit_pricing(id);


--
-- Name: purchase_order_items purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchase_orders purchase_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: sale_items sale_items_sku_pricing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sku_pricing_id_fkey FOREIGN KEY (sku_pricing_id) REFERENCES public.sku_pricing(id);


--
-- Name: sale_items sale_items_unit_pricing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_unit_pricing_id_fkey FOREIGN KEY (unit_pricing_id) REFERENCES public.unit_pricing(id);


--
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sku_pricing sku_pricing_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sku_pricing
    ADD CONSTRAINT sku_pricing_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

