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
    stock_unit public.sku_type DEFAULT 'per_piece'::public.sku_type NOT NULL
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
    updated_at timestamp without time zone DEFAULT now() NOT NULL
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
1	1	1	57.00	t	\N	2024-12-04 19:19:36.841183	2024-12-04 19:19:36.841183
2	3	2	45.00	t	\N	2024-12-05 08:24:12.743579	2024-12-05 08:24:12.743579
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, sku, buying_price, selling_price, stock, category, min_stock, max_stock, reorder_point, created_at, updated_at, stock_unit) FROM stdin;
3	boxers	45454	45.00	70.00	-21	boxers	10	100	20	2024-12-05 08:23:37.902187	2024-12-05 08:25:09.787	per_piece
4	Ben 10 S	Pieces 	83.33	150.00	-46	boxers	10	100	20	2024-12-05 08:34:14.647455	2024-12-05 08:34:14.647455	per_piece
1	New Product	44g55	57.00	78.00	-50	bra	10	100	20	2024-12-04 19:19:14.347645	2024-12-05 08:25:56.826	per_piece
2	another one	ete	56.00	65.00	5	boxers	10	100	20	2024-12-04 19:20:05.897472	2024-12-04 19:20:05.897472	per_piece
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, quantity, buying_price, selling_price, created_at, updated_at) FROM stdin;
1	1	1	10	57.00	54.00	2024-12-04 19:21:11.489777	2024-12-04 19:21:11.489777
2	2	1	1	57.00	78.00	2024-12-04 19:30:50.039882	2024-12-04 19:30:50.039882
3	3	3	10	45.00	70.00	2024-12-05 08:24:56.532361	2024-12-05 08:24:56.532361
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_orders (id, supplier_id, user_id, status, order_date, received_date, total, created_at, updated_at) FROM stdin;
1	1	1	received	2024-12-04 19:21:10.87002	2024-12-04 19:21:15.147	570.00	2024-12-04 19:21:10.87002	2024-12-04 19:21:15.147
3	2	1	received	2024-12-05 08:24:56.020327	2024-12-05 08:25:09.634	450.00	2024-12-05 08:24:56.020327	2024-12-05 08:25:09.634
2	1	1	received	2024-12-04 19:30:49.310849	2024-12-05 08:25:56.716	57.00	2024-12-04 19:30:49.310849	2024-12-05 08:25:56.716
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_items (id, sale_id, product_id, quantity, price, created_at, updated_at) FROM stdin;
1	1	2	3	65.00	2024-12-04 19:20:16.297544	2024-12-04 19:20:16.297544
2	1	1	2	54.00	2024-12-04 19:20:16.297544	2024-12-04 19:20:16.297544
3	2	2	3	65.00	2024-12-04 19:22:13.140302	2024-12-04 19:22:13.140302
4	2	1	2	54.00	2024-12-04 19:22:13.140302	2024-12-04 19:22:13.140302
5	3	1	1	54.00	2024-12-04 19:29:54.769868	2024-12-04 19:29:54.769868
6	3	2	1	65.00	2024-12-04 19:29:54.769868	2024-12-04 19:29:54.769868
7	4	1	1	78.00	2024-12-05 08:24:25.87992	2024-12-05 08:24:25.87992
8	4	2	1	65.00	2024-12-05 08:24:25.87992	2024-12-05 08:24:25.87992
9	4	3	1	67.00	2024-12-05 08:24:25.87992	2024-12-05 08:24:25.87992
10	5	3	3	70.00	2024-12-05 08:28:04.76658	2024-12-05 08:28:04.76658
11	5	2	1	65.00	2024-12-05 08:28:04.76658	2024-12-05 08:28:04.76658
12	6	4	1	150.00	2024-12-05 08:43:12.899184	2024-12-05 08:43:12.899184
13	6	2	1	65.00	2024-12-05 08:43:12.899184	2024-12-05 08:43:12.899184
14	6	3	1	70.00	2024-12-05 08:43:12.899184	2024-12-05 08:43:12.899184
15	6	1	1	78.00	2024-12-05 08:43:12.899184	2024-12-05 08:43:12.899184
16	7	4	2	150.00	2024-12-05 10:45:10.955063	2024-12-05 10:45:10.955063
17	7	1	3	78.00	2024-12-05 10:45:10.955063	2024-12-05 10:45:10.955063
18	7	2	5	65.00	2024-12-05 10:45:10.955063	2024-12-05 10:45:10.955063
19	7	3	6	70.00	2024-12-05 10:45:10.955063	2024-12-05 10:45:10.955063
20	8	4	5	150.00	2024-12-05 10:50:11.967797	2024-12-05 10:50:11.967797
21	8	1	5	78.00	2024-12-05 10:50:11.967797	2024-12-05 10:50:11.967797
22	9	4	1	150.00	2024-12-06 17:50:26.072105	2024-12-06 17:50:26.072105
23	9	1	1	78.00	2024-12-06 17:50:26.072105	2024-12-06 17:50:26.072105
24	9	2	1	65.00	2024-12-06 17:50:26.072105	2024-12-06 17:50:26.072105
25	10	4	4	150.00	2024-12-09 07:04:41.076205	2024-12-09 07:04:41.076205
26	10	1	1	78.00	2024-12-09 07:04:41.076205	2024-12-09 07:04:41.076205
27	10	2	1	65.00	2024-12-09 07:04:41.076205	2024-12-09 07:04:41.076205
28	10	3	1	70.00	2024-12-09 07:04:41.076205	2024-12-09 07:04:41.076205
29	11	4	4	150.00	2024-12-09 07:04:46.770677	2024-12-09 07:04:46.770677
30	11	1	1	78.00	2024-12-09 07:04:46.770677	2024-12-09 07:04:46.770677
31	11	2	1	65.00	2024-12-09 07:04:46.770677	2024-12-09 07:04:46.770677
32	11	3	1	70.00	2024-12-09 07:04:46.770677	2024-12-09 07:04:46.770677
33	12	4	4	150.00	2024-12-09 07:05:39.484268	2024-12-09 07:05:39.484268
34	12	1	1	78.00	2024-12-09 07:05:39.484268	2024-12-09 07:05:39.484268
35	12	2	1	65.00	2024-12-09 07:05:39.484268	2024-12-09 07:05:39.484268
36	12	3	1	70.00	2024-12-09 07:05:39.484268	2024-12-09 07:05:39.484268
37	13	4	4	150.00	2024-12-09 07:05:59.87046	2024-12-09 07:05:59.87046
38	13	1	1	78.00	2024-12-09 07:05:59.87046	2024-12-09 07:05:59.87046
39	13	2	1	65.00	2024-12-09 07:05:59.87046	2024-12-09 07:05:59.87046
40	13	3	1	70.00	2024-12-09 07:05:59.87046	2024-12-09 07:05:59.87046
41	14	1	2	78.00	2024-12-09 07:13:30.029061	2024-12-09 07:13:30.029061
42	14	3	1	70.00	2024-12-09 07:13:30.029061	2024-12-09 07:13:30.029061
43	14	2	1	65.00	2024-12-09 07:13:30.029061	2024-12-09 07:13:30.029061
44	15	4	1	150.00	2024-12-09 07:18:31.989045	2024-12-09 07:18:31.989045
45	15	1	1	78.00	2024-12-09 07:18:31.989045	2024-12-09 07:18:31.989045
46	15	2	1	65.00	2024-12-09 07:18:31.989045	2024-12-09 07:18:31.989045
47	16	2	1	65.00	2024-12-09 07:35:17.751551	2024-12-09 07:35:17.751551
48	16	1	1	78.00	2024-12-09 07:35:17.751551	2024-12-09 07:35:17.751551
49	16	4	1	150.00	2024-12-09 07:35:17.751551	2024-12-09 07:35:17.751551
50	17	1	1	78.00	2024-12-09 07:36:16.926495	2024-12-09 07:36:16.926495
51	17	2	1	65.00	2024-12-09 07:36:16.926495	2024-12-09 07:36:16.926495
52	17	3	1	70.00	2024-12-09 07:36:16.926495	2024-12-09 07:36:16.926495
53	18	2	1	65.00	2024-12-09 07:56:25.172102	2024-12-09 07:56:25.172102
54	18	1	1	78.00	2024-12-09 07:56:25.172102	2024-12-09 07:56:25.172102
55	18	4	1	150.00	2024-12-09 07:56:25.172102	2024-12-09 07:56:25.172102
56	19	2	1	65.00	2024-12-09 07:56:39.136297	2024-12-09 07:56:39.136297
57	19	1	1	78.00	2024-12-09 07:56:39.136297	2024-12-09 07:56:39.136297
58	19	4	1	150.00	2024-12-09 07:56:39.136297	2024-12-09 07:56:39.136297
59	20	3	1	70.00	2024-12-09 10:04:15.296815	2024-12-09 10:04:15.296815
60	20	2	1	65.00	2024-12-09 10:04:15.296815	2024-12-09 10:04:15.296815
61	20	1	1	78.00	2024-12-09 10:04:15.296815	2024-12-09 10:04:15.296815
62	21	2	1	65.00	2024-12-09 10:09:48.748448	2024-12-09 10:09:48.748448
63	21	3	1	70.00	2024-12-09 10:09:48.748448	2024-12-09 10:09:48.748448
64	21	1	1	78.00	2024-12-09 10:09:48.748448	2024-12-09 10:09:48.748448
65	22	4	1	150.00	2024-12-09 10:15:42.778279	2024-12-09 10:15:42.778279
66	22	1	1	78.00	2024-12-09 10:15:42.778279	2024-12-09 10:15:42.778279
67	22	2	1	65.00	2024-12-09 10:15:42.778279	2024-12-09 10:15:42.778279
68	22	3	1	70.00	2024-12-09 10:15:42.778279	2024-12-09 10:15:42.778279
69	23	2	1	65.00	2024-12-09 10:19:31.621282	2024-12-09 10:19:31.621282
70	23	1	1	78.00	2024-12-09 10:19:31.621282	2024-12-09 10:19:31.621282
71	23	4	1	150.00	2024-12-09 10:19:31.621282	2024-12-09 10:19:31.621282
72	24	4	1	150.00	2024-12-09 10:24:31.552593	2024-12-09 10:24:31.552593
73	24	1	1	78.00	2024-12-09 10:24:31.552593	2024-12-09 10:24:31.552593
74	24	2	1	65.00	2024-12-09 10:24:31.552593	2024-12-09 10:24:31.552593
75	25	4	1	150.00	2024-12-09 10:25:02.118086	2024-12-09 10:25:02.118086
76	25	1	1	78.00	2024-12-09 10:25:02.118086	2024-12-09 10:25:02.118086
77	25	2	1	65.00	2024-12-09 10:25:02.118086	2024-12-09 10:25:02.118086
78	25	3	1	70.00	2024-12-09 10:25:02.118086	2024-12-09 10:25:02.118086
79	26	2	1	65.00	2024-12-09 10:31:25.863706	2024-12-09 10:31:25.863706
80	26	1	1	78.00	2024-12-09 10:31:25.863706	2024-12-09 10:31:25.863706
81	26	4	1	150.00	2024-12-09 10:31:25.863706	2024-12-09 10:31:25.863706
82	26	3	1	70.00	2024-12-09 10:31:25.863706	2024-12-09 10:31:25.863706
83	27	4	1	150.00	2024-12-09 10:34:58.310415	2024-12-09 10:34:58.310415
84	27	1	1	78.00	2024-12-09 10:34:58.310415	2024-12-09 10:34:58.310415
85	27	2	1	65.00	2024-12-09 10:34:58.310415	2024-12-09 10:34:58.310415
86	28	4	1	150.00	2024-12-09 10:35:32.483408	2024-12-09 10:35:32.483408
87	28	1	1	78.00	2024-12-09 10:35:32.483408	2024-12-09 10:35:32.483408
88	28	2	1	65.00	2024-12-09 10:35:32.483408	2024-12-09 10:35:32.483408
89	28	3	1	70.00	2024-12-09 10:35:32.483408	2024-12-09 10:35:32.483408
90	29	4	1	150.00	2024-12-09 10:39:28.689714	2024-12-09 10:39:28.689714
91	29	1	1	78.00	2024-12-09 10:39:28.689714	2024-12-09 10:39:28.689714
92	29	2	1	65.00	2024-12-09 10:39:28.689714	2024-12-09 10:39:28.689714
93	29	3	1	70.00	2024-12-09 10:39:28.689714	2024-12-09 10:39:28.689714
94	30	3	1	70.00	2024-12-09 10:39:57.185306	2024-12-09 10:39:57.185306
95	30	2	1	65.00	2024-12-09 10:39:57.185306	2024-12-09 10:39:57.185306
96	30	1	1	78.00	2024-12-09 10:39:57.185306	2024-12-09 10:39:57.185306
97	31	3	1	70.00	2024-12-09 10:40:37.170513	2024-12-09 10:40:37.170513
98	31	2	1	65.00	2024-12-09 10:40:37.170513	2024-12-09 10:40:37.170513
99	31	1	1	78.00	2024-12-09 10:40:37.170513	2024-12-09 10:40:37.170513
100	32	4	1	150.00	2024-12-09 10:49:23.645459	2024-12-09 10:49:23.645459
101	32	1	1	78.00	2024-12-09 10:49:23.645459	2024-12-09 10:49:23.645459
102	32	2	1	65.00	2024-12-09 10:49:23.645459	2024-12-09 10:49:23.645459
103	32	3	1	70.00	2024-12-09 10:49:23.645459	2024-12-09 10:49:23.645459
104	33	4	1	150.00	2024-12-09 10:49:29.605477	2024-12-09 10:49:29.605477
105	33	1	1	78.00	2024-12-09 10:49:29.605477	2024-12-09 10:49:29.605477
106	33	2	1	65.00	2024-12-09 10:49:29.605477	2024-12-09 10:49:29.605477
107	33	3	1	70.00	2024-12-09 10:49:29.605477	2024-12-09 10:49:29.605477
108	34	4	1	150.00	2024-12-09 10:49:46.496951	2024-12-09 10:49:46.496951
109	34	1	1	78.00	2024-12-09 10:49:46.496951	2024-12-09 10:49:46.496951
110	34	2	1	65.00	2024-12-09 10:49:46.496951	2024-12-09 10:49:46.496951
111	34	3	1	70.00	2024-12-09 10:49:46.496951	2024-12-09 10:49:46.496951
112	35	2	1	65.00	2024-12-09 12:56:13.809801	2024-12-09 12:56:13.809801
113	35	1	1	78.00	2024-12-09 12:56:13.809801	2024-12-09 12:56:13.809801
114	35	4	1	150.00	2024-12-09 12:56:13.809801	2024-12-09 12:56:13.809801
115	36	2	1	65.00	2024-12-09 13:16:49.531019	2024-12-09 13:16:49.531019
116	36	1	1	78.00	2024-12-09 13:16:49.531019	2024-12-09 13:16:49.531019
117	36	4	1	150.00	2024-12-09 13:16:49.531019	2024-12-09 13:16:49.531019
118	37	3	1	70.00	2024-12-09 13:17:31.027056	2024-12-09 13:17:31.027056
119	37	2	1	65.00	2024-12-09 13:17:31.027056	2024-12-09 13:17:31.027056
120	37	1	1	78.00	2024-12-09 13:17:31.027056	2024-12-09 13:17:31.027056
121	37	4	1	150.00	2024-12-09 13:17:31.027056	2024-12-09 13:17:31.027056
122	38	3	1	70.00	2024-12-09 13:17:51.619063	2024-12-09 13:17:51.619063
123	38	2	1	65.00	2024-12-09 13:17:51.619063	2024-12-09 13:17:51.619063
124	38	1	1	78.00	2024-12-09 13:17:51.619063	2024-12-09 13:17:51.619063
125	39	3	1	70.00	2024-12-09 13:20:22.698835	2024-12-09 13:20:22.698835
126	39	2	2	65.00	2024-12-09 13:20:22.698835	2024-12-09 13:20:22.698835
127	40	2	1	65.00	2024-12-09 13:23:04.847577	2024-12-09 13:23:04.847577
128	40	1	2	78.00	2024-12-09 13:23:04.847577	2024-12-09 13:23:04.847577
129	41	4	1	150.00	2024-12-09 13:23:44.912754	2024-12-09 13:23:44.912754
130	41	1	1	78.00	2024-12-09 13:23:44.912754	2024-12-09 13:23:44.912754
131	41	2	1	65.00	2024-12-09 13:23:44.912754	2024-12-09 13:23:44.912754
132	42	3	1	70.00	2024-12-09 13:23:58.247339	2024-12-09 13:23:58.247339
133	42	2	1	65.00	2024-12-09 13:23:58.247339	2024-12-09 13:23:58.247339
134	42	1	1	78.00	2024-12-09 13:23:58.247339	2024-12-09 13:23:58.247339
135	42	4	1	150.00	2024-12-09 13:23:58.247339	2024-12-09 13:23:58.247339
136	43	2	1	65.00	2024-12-09 13:25:11.506484	2024-12-09 13:25:11.506484
137	43	1	1	78.00	2024-12-09 13:25:11.506484	2024-12-09 13:25:11.506484
138	43	4	1	150.00	2024-12-09 13:25:11.506484	2024-12-09 13:25:11.506484
139	44	4	1	150.00	2024-12-09 13:25:28.067576	2024-12-09 13:25:28.067576
140	44	1	1	78.00	2024-12-09 13:25:28.067576	2024-12-09 13:25:28.067576
141	44	2	1	65.00	2024-12-09 13:25:28.067576	2024-12-09 13:25:28.067576
142	44	3	1	70.00	2024-12-09 13:25:28.067576	2024-12-09 13:25:28.067576
143	45	3	1	70.00	2024-12-09 13:25:55.598079	2024-12-09 13:25:55.598079
144	45	2	1	65.00	2024-12-09 13:25:55.598079	2024-12-09 13:25:55.598079
145	45	1	1	78.00	2024-12-09 13:25:55.598079	2024-12-09 13:25:55.598079
146	45	4	1	150.00	2024-12-09 13:25:55.598079	2024-12-09 13:25:55.598079
147	46	1	2	78.00	2024-12-09 13:26:05.173531	2024-12-09 13:26:05.173531
148	46	2	1	65.00	2024-12-09 13:26:05.173531	2024-12-09 13:26:05.173531
149	47	2	1	65.00	2024-12-09 13:26:14.953292	2024-12-09 13:26:14.953292
150	47	1	1	78.00	2024-12-09 13:26:14.953292	2024-12-09 13:26:14.953292
151	47	4	1	150.00	2024-12-09 13:26:14.953292	2024-12-09 13:26:14.953292
152	48	4	1	150.00	2024-12-09 13:26:47.479414	2024-12-09 13:26:47.479414
153	48	1	1	78.00	2024-12-09 13:26:47.479414	2024-12-09 13:26:47.479414
154	48	3	1	70.00	2024-12-09 13:26:47.479414	2024-12-09 13:26:47.479414
155	49	2	1	65.00	2024-12-09 13:32:09.574157	2024-12-09 13:32:09.574157
156	49	1	1	78.00	2024-12-09 13:32:09.574157	2024-12-09 13:32:09.574157
157	49	4	1	150.00	2024-12-09 13:32:09.574157	2024-12-09 13:32:09.574157
158	50	4	1	150.00	2024-12-09 13:35:50.278416	2024-12-09 13:35:50.278416
159	50	1	1	78.00	2024-12-09 13:35:50.278416	2024-12-09 13:35:50.278416
160	50	2	1	65.00	2024-12-09 13:35:50.278416	2024-12-09 13:35:50.278416
161	50	3	1	70.00	2024-12-09 13:35:50.278416	2024-12-09 13:35:50.278416
162	51	4	1	150.00	2024-12-09 13:40:16.517741	2024-12-09 13:40:16.517741
163	51	1	1	78.00	2024-12-09 13:40:16.517741	2024-12-09 13:40:16.517741
164	51	2	1	65.00	2024-12-09 13:40:16.517741	2024-12-09 13:40:16.517741
165	51	3	1	70.00	2024-12-09 13:40:16.517741	2024-12-09 13:40:16.517741
166	52	1	1	78.00	2024-12-09 13:42:47.646908	2024-12-09 13:42:47.646908
167	52	4	1	150.00	2024-12-09 13:42:47.646908	2024-12-09 13:42:47.646908
168	52	3	1	70.00	2024-12-09 13:42:47.646908	2024-12-09 13:42:47.646908
169	53	4	1	150.00	2024-12-09 13:58:24.76224	2024-12-09 13:58:24.76224
170	53	1	1	78.00	2024-12-09 13:58:24.76224	2024-12-09 13:58:24.76224
171	53	2	1	65.00	2024-12-09 13:58:24.76224	2024-12-09 13:58:24.76224
172	53	3	1	70.00	2024-12-09 13:58:24.76224	2024-12-09 13:58:24.76224
173	54	4	1	150.00	2024-12-09 14:00:17.277501	2024-12-09 14:00:17.277501
174	54	1	1	78.00	2024-12-09 14:00:17.277501	2024-12-09 14:00:17.277501
175	54	2	1	65.00	2024-12-09 14:00:17.277501	2024-12-09 14:00:17.277501
176	54	3	1	70.00	2024-12-09 14:00:17.277501	2024-12-09 14:00:17.277501
177	55	4	1	150.00	2024-12-09 14:13:03.977699	2024-12-09 14:13:03.977699
178	55	1	1	78.00	2024-12-09 14:13:03.977699	2024-12-09 14:13:03.977699
179	55	2	1	65.00	2024-12-09 14:13:03.977699	2024-12-09 14:13:03.977699
180	56	4	1	150.00	2024-12-09 14:13:24.640001	2024-12-09 14:13:24.640001
181	56	1	1	78.00	2024-12-09 14:13:24.640001	2024-12-09 14:13:24.640001
182	56	2	1	65.00	2024-12-09 14:13:24.640001	2024-12-09 14:13:24.640001
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
\.


--
-- Data for Name: sku_pricing; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sku_pricing (id, product_id, sku_type, buying_price, selling_price, created_at, updated_at) FROM stdin;
1	1	per_piece	57.00	78.00	2024-12-09 13:48:45.550492	2024-12-09 13:48:45.550492
2	4	per_piece	83.33	150.00	2024-12-09 13:48:45.550492	2024-12-09 13:48:45.550492
3	3	per_piece	45.00	70.00	2024-12-09 13:48:45.550492	2024-12-09 13:48:45.550492
4	2	per_piece	56.00	65.00	2024-12-09 13:48:45.550492	2024-12-09 13:48:45.550492
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.suppliers (id, name, email, phone, address, created_at, updated_at) FROM stdin;
1	Samuel Mbugua Nyambura	Samnmbuguah@gmail.com	0713087979	P.O. BOX 14329	2024-12-04 19:19:25.798724	2024-12-04 19:19:25.798724
2	new supplier2	Samnmbuguah@gmail.com	0713087979	P.O. BOX 14329	2024-12-05 08:24:02.415651	2024-12-05 08:24:02.415651
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

SELECT pg_catalog.setval('public.products_id_seq', 11, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 3, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 3, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 182, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sales_id_seq', 57, true);


--
-- Name: sku_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sku_pricing_id_seq', 4, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 2, true);


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

