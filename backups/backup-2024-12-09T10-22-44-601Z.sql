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
    updated_at timestamp without time zone DEFAULT now() NOT NULL
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

COPY public.products (id, name, sku, buying_price, selling_price, stock, category, min_stock, max_stock, reorder_point, created_at, updated_at) FROM stdin;
3	boxers	45454	45.00	70.00	0	boxers	10	100	20	2024-12-05 08:23:37.902187	2024-12-05 08:25:09.787
2	another one	ete	56.00	65.00	37	boxers	10	100	20	2024-12-04 19:20:05.897472	2024-12-04 19:20:05.897472
1	New Product	44g55	57.00	78.00	-16	bra	10	100	20	2024-12-04 19:19:14.347645	2024-12-05 08:25:56.826
4	Ben 10 S	Pieces 	83.33	150.00	-19	boxers	10	100	20	2024-12-05 08:34:14.647455	2024-12-05 08:34:14.647455
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

SELECT pg_catalog.setval('public.customers_id_seq', 2, true);


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

SELECT pg_catalog.setval('public.products_id_seq', 10, true);


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

SELECT pg_catalog.setval('public.sale_items_id_seq', 71, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sales_id_seq', 23, true);


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

