# 👋 Hello, I'm Ben Macha (BEN MECHA)! 🇵🇸 | ❤️ Open Source
I'm a **Full Stack Developer** passionate about web and mobile development, specializing in **Symfony, React, and Vue.js**. I have strong experience in software architecture and technical leadership. 🚀

## 🏢 Organizations & Projects

<!-- ORGS:START -->
![Organizations and projects: Pepprio (restaurant order management, github.com/pepprio, pepprio.com), Pignelle (tools for real estate agencies, github.com/Pignelle, pignelle.com), BenMacha (personal workshop, github.com/BenMacha, benmacha.tn)](profile-contrib/orgs.svg)

[Pepprio](https://github.com/pepprio) · [pepprio.com](https://pepprio.com/) — [Pignelle](https://github.com/Pignelle) · [pignelle.com](https://pignelle.com) — [BenMacha](https://github.com/BenMacha) · [benmacha.tn](https://benmacha.tn/)
<!-- ORGS:END -->

## 🛠️ Tech Stack & Skills

<!-- STACK:START -->
![Tech stack. Backend: PHP, Symfony, Laravel, Node.js, Python, API Platform, PHPUnit, Codeception. Frontend: React, Next.js, Vue.js, Nuxt.js, JavaScript, Tailwind CSS, Ionic, Capacitor, Flutter, Cypress. DevOps & Tools: Docker, Traefik, Jenkins, Postfix, GitHub Actions, Linux, Nginx, Apache. Database: MySQL, Redis, MariaDB. IDE & Development: PhpStorm, VS Code, Git, GitHub.](profile-contrib/stack.svg)
<!-- STACK:END -->

## 📦 Packages

<!-- PACKAGES:START -->
![Packages on Packagist: benmacha/diagram-bundle, Interactive Doctrine entity diagram for Symfony: JSON API + React studio usable from Twig, plain JS, React and Vue; benmacha/mousetracker, Self-hosted mouse, click and scroll tracker for Symfony: heatmaps, scroll maps and session replay. React dashboard usable from Twig, plain JS, React and Vue; benmacha/audit-bundle, A comprehensive Symfony bundle for auditing entity changes with rollback functionality, web interface, and REST API; benmacha/templatebundle, Symfony Template Bundle](profile-contrib/packages.svg)

[diagram-bundle](https://github.com/BenMacha/diagram-bundle) · [mousetracker](https://github.com/BenMacha/mouseTracker) · [audit-bundle](https://github.com/BenMacha/audit-bundle) · [templatebundle](https://github.com/BenMacha/Templatebundle) · [all on Packagist](https://packagist.org/packages/benmacha/)

Also: [authx-bundle](https://github.com/BenMacha/authx-bundle) (JWT, OpenID Connect, user management and audit logging for Symfony), [omnimail-mcp](https://github.com/BenMacha/omnimail-mcp) (open source multi-account mail MCP server: iCloud, Gmail, Outlook, Yahoo, Proton, Infomaniak, IMAP), and the [Uber Eats PHP SDK](https://github.com/BenMacha/ubereat-php), now maintained as `pepprio/uber-eats-sdk-php`.
<!-- PACKAGES:END -->

## 🤝 Open Source Contributions

<!-- CONTRIBUTIONS:START -->
![Open source pull request line: pull requests reviewed, merged or under review](profile-contrib/pr-machine.svg)

![Open source card index: one drawer per contributed project, one card per pull request, green tab merged, red tab under review](profile-contrib/pr-cabinet.svg)

22 merged, 16 under review (0 approved) and 6 closed without merge, updated hourly. Rejected pull requests stay listed: the reviews they got are part of the work.

### [Symfony](https://github.com/symfony/symfony)

- Taken over by a maintainer: [#67725](https://github.com/symfony/symfony/pull/67725), Doctrine message id validation, rewritten by Nicolas Grekas from my [#67722](https://github.com/symfony/symfony/pull/67722)
- Taken over by a maintainer: [#67726](https://github.com/symfony/symfony/pull/67726), re-authentication kept for legacy tokens, rewritten by Nicolas Grekas from my [#67723](https://github.com/symfony/symfony/pull/67723)

Merged (16):

- [#67723](https://github.com/symfony/symfony/pull/67723) **Security**: Do not request a re-authentication that cannot prove a recent authentication
- [#67722](https://github.com/symfony/symfony/pull/67722) **Messenger**: Ignore ids that are not integers when finding a message of the Doctrine transport
- [#67712](https://github.com/symfony/symfony/pull/67712) **Messenger**: Stop keeping alive the messages that a listener prevents the worker from handling
- [#67711](https://github.com/symfony/symfony/pull/67711) **Messenger**: Do not resend the stamp headers of a received AMQP message
- [#67710](https://github.com/symfony/symfony/pull/67710) **Messenger**: Do not expose the Redis DSN in the invalid host query parameter exception
- [#67709](https://github.com/symfony/symfony/pull/67709) **Messenger**: Restore the schema assets filter when the Doctrine transport setup fails
- [#67708](https://github.com/symfony/symfony/pull/67708) **Security**: Ignore target and failure paths that are neither paths nor absolute URLs
- [#67707](https://github.com/symfony/symfony/pull/67707) **Security**: Reject login links with an out of range "expires" parameter
- [#67706](https://github.com/symfony/symfony/pull/67706) **Security**: Reject remember-me cookies with an invalid expiration time
- [#67705](https://github.com/symfony/symfony/pull/67705) **RateLimiter**: Validate the refill amount, the fixed window interval and the sliding window limit
- [#67704](https://github.com/symfony/symfony/pull/67704) **Cache**: Fix the SQL of PdoTagAwareAdapter on MySQL, PostgreSQL, Oracle and SQL Server
- [#67703](https://github.com/symfony/symfony/pull/67703) **Cache**: Honor the $save flag set by the callback in EarlyExpirationHandler
- [#67702](https://github.com/symfony/symfony/pull/67702) **Form**: Fix submitting "0" to a non-compound root form
- [#67701](https://github.com/symfony/symfony/pull/67701) **Form**: Fix the post_max_size check when it is set to a negative value
- [#67700](https://github.com/symfony/symfony/pull/67700) **Form**: Ignore collection entries with invalid names when allow_add is enabled
- [#67699](https://github.com/symfony/symfony/pull/67699) **Form**: Validate the collection entries that keep_as_list doesn't need to renumber

### [API Platform](https://github.com/api-platform/core)

Under review (9):

- [#8783](https://github.com/api-platform/core/pull/8783) **laravel**: filter on every value given to EqualsFilter
- [#8782](https://github.com/api-platform/core/pull/8782) **laravel**: purge the HTTP cache on GraphQL mutations
- [#8781](https://github.com/api-platform/core/pull/8781) **laravel**: ignore non-string values in search filters
- [#8780](https://github.com/api-platform/core/pull/8780) **serializer**: unwrap the collection key type, not the collection type
- [#8779](https://github.com/api-platform/core/pull/8779) **state**: reject invalid GraphQL pagination cursors
- [#8778](https://github.com/api-platform/core/pull/8778) **serializer**: reject a non-string id in JSON-LD and JSON:API relations
- [#8777](https://github.com/api-platform/core/pull/8777) **doctrine**: left join collection associations in IriFilter inside OR groups
- [#8776](https://github.com/api-platform/core/pull/8776) **doctrine**: reject too large pages with ODM partial pagination
- [#8775](https://github.com/api-platform/core/pull/8775) **doctrine**: ignore nested array values in range and search filters

### [API Platform installer](https://github.com/api-platform/api-platform)

Under review (2):

- [#3024](https://github.com/api-platform/api-platform/pull/3024) validate the --symfony-docker-ref value
- [#3023](https://github.com/api-platform/api-platform/pull/3023) print the release version

### [Caddy](https://github.com/caddyserver/caddy)

Merged (5):

- [#8322](https://github.com/caddyserver/caddy/pull/8322) **fileserver**: handle empty files in size try policies
- [#8320](https://github.com/caddyserver/caddy/pull/8320) **reverseproxy**: skip unavailable upstream with a single weighted_round_robin weight
- [#8318](https://github.com/caddyserver/caddy/pull/8318) **reverseproxy**: close upstream body when handle_response status is invalid
- [#8317](https://github.com/caddyserver/caddy/pull/8317) **admin**: authorize remote requests matching any permission entry
- [#8316](https://github.com/caddyserver/caddy/pull/8316) **caddyfile**: reject negative import argument indices

Under review (2):

- [#8343](https://github.com/caddyserver/caddy/pull/8343) **caddyhttp**: lower-case path patterns with placeholders at request time
- [#8342](https://github.com/caddyserver/caddy/pull/8342) **fastcgi**: fail the request when a param name cannot fit in a record

Closed without merge (3):

- [#8323](https://github.com/caddyserver/caddy/pull/8323) **logging**: close the redialed conn when writing to it fails
- [#8321](https://github.com/caddyserver/caddy/pull/8321) **fastcgi**: skip params whose name cannot fit in a record
- [#8319](https://github.com/caddyserver/caddy/pull/8319) **caddyhttp**: keep placeholder names intact in path matcher

### [Ting](https://github.com/ccmbenchmark/ting) (CCM Benchmark ORM)

- [#120](https://github.com/ccmbenchmark/ting/issues/120) reported an SQL injection in the PostgreSQL driver, fixed upstream in 4.1.1

Under review (3):

- [#137](https://github.com/ccmbenchmark/ting/pull/137) **ci**: fix the lowest-deps job, add PHP 8.5, composer audit, Dependabot, issue template and security policy
- [#136](https://github.com/ccmbenchmark/ting/pull/136) **security**: escape SQL identifiers, validate order keys, quote the Pgsql DSN and check timezones
- [#123](https://github.com/ccmbenchmark/ting/pull/123) Fix #122: Missing Return Statement in PostgreSQL Driver

Closed without merge (1):

- [#121](https://github.com/ccmbenchmark/ting/pull/121) Fix #120: SQL Injection Vulnerability in PostgreSQL Driver

### [Ting for API Platform](https://github.com/ccmbenchmark/ting_api_platform)

Merged (1):

- [#18](https://github.com/ccmbenchmark/ting_api_platform/pull/18) add enum filter

### [invoice-parser](https://github.com/novalend/invoice-parser)

Closed without merge (1):

- [#12](https://github.com/novalend/invoice-parser/pull/12) Project Update

### [swot](https://github.com/JetBrains/swot)

Closed without merge (1):

- [#5681](https://github.com/JetBrains/swot/pull/5681) Create cubes.txt
<!-- CONTRIBUTIONS:END -->

## 🌍 [Personal Portfolio](https://github.com/BenMacha/benmacha.github.io)
A professional multilingual portfolio built with **Vue.js 3, TypeScript, and Tailwind CSS** showcasing my work and experience.

## 📈 GitHub Stats
![GitHub stats: the contribution calendar of the last 52 weeks as an isometric plate of blocks, counters and top languages](profile-contrib/github-stats.svg)

## 📝 Contact
- 🌍 Website: [https://benmacha.tn](https://benmacha.tn)
- 💼 LinkedIn: [BEN MECHA Ali](https://www.linkedin.com/in/benmacha/)
- 📧 Email: [contact@benmacha.tn](mailto:contact@benmacha.tn)

🚀 Let's build something amazing together!
