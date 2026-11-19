import { env } from '../config/env.js'
import { repo } from '../config/store.js'

const cache = new Map()

function cacheGet(key, ttl) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.value
  return null
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value })
  return value
}

export function clearGithubCache() {
  cache.clear()
}

async function githubUsername() {
  const settings = await repo.findOne('settings', { key: 'site' })
  return settings?.github?.username || env.github.username
}

async function gh(path, { token = env.github.token } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'kevin-cyber-portfolio',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const error = new Error(`GitHub API ${res.status}: ${body.slice(0, 200) || res.statusText}`)
    error.status = res.status
    error.rateRemaining = res.headers.get('x-ratelimit-remaining')
    throw error
  }
  return { data: await res.json(), headers: res.headers }
}

async function ghGraphQL(query, variables) {
  if (!env.github.token) throw new Error('GITHUB_TOKEN is required for GraphQL queries')
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.github.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'kevin-cyber-portfolio',
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (!res.ok || json.errors) throw new Error(json.errors?.[0]?.message || `GraphQL ${res.status}`)
  return json.data
}

const eventVerb = {
  PushEvent: 'Pushed commits',
  PullRequestEvent: 'Pull request',
  IssuesEvent: 'Issue',
  IssueCommentEvent: 'Commented on an issue',
  CreateEvent: 'Created',
  ReleaseEvent: 'Released',
  ForkEvent: 'Forked',
  WatchEvent: 'Starred',
  PullRequestReviewEvent: 'Reviewed a pull request',
  DiscussionEvent: 'Discussion',
}

function mapEvent(e) {
  const payload = e.payload || {}
  let title = eventVerb[e.type] || e.type.replace(/Event$/, '')
  if (e.type === 'PushEvent') title = `Pushed ${payload.commits?.length || 0} commit(s)`
  if (e.type === 'PullRequestEvent') title = `${payload.action || 'Updated'} PR #${payload.pull_request?.number || ''}: ${payload.pull_request?.title || ''}`
  if (e.type === 'IssuesEvent') title = `${payload.action || 'Updated'} issue #${payload.issue?.number || ''}: ${payload.issue?.title || ''}`
  if (e.type === 'CreateEvent') title = `Created ${payload.ref_type || 'resource'} ${payload.ref || ''}`.trim()
  if (e.type === 'ReleaseEvent') title = `Published ${payload.release?.name || 'a release'}`
  return {
    type:
      e.type === 'PushEvent'
        ? 'commit'
        : e.type === 'PullRequestEvent'
          ? 'pull_request'
          : e.type === 'IssuesEvent'
            ? 'issue'
            : e.type === 'DiscussionEvent'
              ? 'discussion'
              : 'repo',
    repo: e.repo?.name || '',
    title: title.slice(0, 220),
    url: `https://github.com/${e.repo?.name || ''}`,
    date: e.created_at,
  }
}

async function contributions(username) {
  if (!env.github.token) return null
  try {
    const data = await ghGraphQL(
      `query($login:String!){ user(login:$login){ contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`,
      { login: username }
    )
    const cal = data?.user?.contributionsCollection?.contributionCalendar
    if (!cal) return null
    return {
      total: cal.totalContributions,
      days: cal.weeks.flatMap((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
      ),
    }
  } catch {
    return null
  }
}

async function mergedPullRequests(username) {
  if (!env.github.token) return null
  try {
    const { data } = await gh(
      `/search/issues?q=${encodeURIComponent(`is:pr is:merged author:${username}`)}&per_page=1`
    )
    return data.total_count ?? null
  } catch {
    return null
  }
}

export async function getGithubSummary({ force = false } = {}) {
  const username = await githubUsername()
  const key = `summary:${username}`
  if (!force) {
    const hit = cacheGet(key, env.github.cacheTtl)
    if (hit) return hit
  }

  if (!username) {
    return cacheSet(key, {
      ok: false,
      username: '',
      error: 'GitHub username is not configured',
      configured: false,
      fetchedAt: new Date().toISOString(),
    })
  }

  try {
    const [userRes, reposRes, eventsRes] = await Promise.all([
      gh(`/users/${encodeURIComponent(username)}`),
      gh(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`),
      gh(`/users/${encodeURIComponent(username)}/events/public?per_page=30`).catch(() => ({ data: [] })),
    ])

    const user = userRes.data
    const repos = Array.isArray(reposRes.data) ? reposRes.data : []
    const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
    const languages = {}
    repos.forEach((r) => {
      if (r.language) languages[r.language] = (languages[r.language] || 0) + 1
    })

    const [contributionData, mergedPRs] = await Promise.all([
      contributions(username),
      mergedPullRequests(username),
    ])

    const summary = {
      ok: true,
      configured: true,
      username,
      profile: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        company: user.company,
        location: user.location,
        blog: user.blog,
        htmlUrl: user.html_url,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        createdAt: user.created_at,
      },
      stars,
      publicRepos: user.public_repos,
      languages: Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
      topRepos: repos
        .filter((r) => !r.fork)
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, 8)
        .map((r) => ({
          name: r.name,
          fullName: r.full_name,
          description: r.description,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          topics: r.topics || [],
          license: r.license?.spdx_id || '',
          url: r.html_url,
          homepage: r.homepage,
          updatedAt: r.updated_at,
        })),
      recentActivity: (Array.isArray(eventsRes.data) ? eventsRes.data : []).slice(0, 12).map(mapEvent),
      contributions: contributionData,
      mergedPRs,
      rateLimit: {
        remaining: userRes.headers.get('x-ratelimit-remaining'),
        reset: userRes.headers.get('x-ratelimit-reset'),
      },
      tokenConfigured: Boolean(env.github.token),
      fetchedAt: new Date().toISOString(),
    }

    // Persist a snapshot so the admin dashboard has history.
    try {
      await repo.upsertOne(
        'github-accounts',
        { username },
        {
          username,
          githubId: String(user.id),
          avatarUrl: user.avatar_url,
          name: user.name || '',
          bio: user.bio || '',
          company: user.company || '',
          location: user.location || '',
          blog: user.blog || '',
          publicRepos: user.public_repos || 0,
          followers: user.followers || 0,
          following: user.following || 0,
          stars,
          lastSyncedAt: new Date(),
        }
      )
    } catch {
      /* snapshot persistence is best-effort */
    }

    return cacheSet(key, summary)
  } catch (error) {
    const failed = {
      ok: false,
      configured: Boolean(env.github.token),
      username,
      error:
        error.status === 404
          ? `GitHub user "${username}" was not found. Set GITHUB_USERNAME to your handle.`
          : error.status === 403
            ? 'GitHub API rate limit reached. Add a GITHUB_TOKEN to raise the limit.'
            : error.message,
      fetchedAt: new Date().toISOString(),
    }
    return cacheSet(key, failed)
  }
}

const check = (key, label, passed, detail = '') => ({ key, label, passed: Boolean(passed), detail })

export async function getRepositoryAudit({ force = false } = {}) {
  const username = await githubUsername()
  const key = `audit:${username}`
  if (!force) {
    const hit = cacheGet(key, 60 * 60 * 1000)
    if (hit) return hit
  }
  const summary = await getGithubSummary({ force })
  if (!summary.ok) return cacheSet(key, { ok: false, error: summary.error, repositories: [] })

  const repos = summary.topRepos.slice(0, 6)
  const results = []

  for (const repo of repos) {
    const [owner, name] = repo.fullName.split('/')
    const exists = async (path) => {
      try {
        const { data } = await gh(`/repos/${owner}/${name}/contents/${path}`)
        return Array.isArray(data) ? data.length > 0 : Boolean(data)
      } catch {
        return false
      }
    }
    const [readme, contributing, issueTemplates, prTemplate] = await Promise.all([
      exists('README.md'),
      exists('CONTRIBUTING.md'),
      exists('.github/ISSUE_TEMPLATE'),
      exists('.github/PULL_REQUEST_TEMPLATE.md'),
    ])

    const checks = [
      check('description', 'Repository description', repo.description, 'A clear one-line description improves discoverability.'),
      check('readme', 'README.md', readme, 'Explain what the project does, install steps and usage.'),
      check('license', 'LICENSE', Boolean(repo.license), 'Add an OSI-approved license.'),
      check('topics', 'Repository topics', repo.topics?.length, 'Add 3–8 accurate topics.'),
      check('contributing', 'CONTRIBUTING.md', contributing, 'Document how others can contribute.'),
      check('issueTemplates', 'Issue templates', issueTemplates, 'Add bug/feature templates for useful reports.'),
      check('prTemplate', 'Pull request template', prTemplate, 'Add a PR checklist and description template.'),
      check('homepage', 'Homepage / demo link', Boolean(repo.homepage), 'Link a live demo when available.'),
    ]
    const passed = checks.filter((c) => c.passed).length
    const score = Math.round((passed / checks.length) * 100)

    results.push({ ...repo, checks, score })
    try {
      await repo.upsertOne(
        'audit',
        { repo: repo.fullName },
        {
          repo: repo.fullName,
          url: repo.url,
          description: repo.description || '',
          stars: repo.stars || 0,
          topics: repo.topics || [],
          score,
          checks,
          lastAuditedAt: new Date(),
        }
      )
    } catch {
      /* best-effort persistence */
    }
  }

  results.sort((a, b) => b.score - a.score)
  return cacheSet(key, {
    ok: true,
    username,
    repositories: results,
    averageScore: results.length
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0,
    auditedAt: new Date().toISOString(),
    note: env.github.token
      ? 'Checks use the GitHub Contents API.'
      : 'Add GITHUB_TOKEN for reliable audits — unauthenticated requests are heavily rate limited.',
  })
}

export async function getSponsorshipCandidates({ force = false } = {}) {
  const key = 'sponsorships'
  if (!force) {
    const hit = cacheGet(key, 24 * 60 * 60 * 1000)
    if (hit) return hit
  }

  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

  const packageFiles = ['package.json', 'client/package.json', 'server/package.json']
  const deps = new Map()
  for (const file of packageFiles) {
    try {
      const json = JSON.parse(await fs.readFile(path.join(root, file), 'utf8'))
      Object.entries({ ...(json.dependencies || {}), ...(json.devDependencies || {}) }).forEach(([name, version]) =>
        deps.set(name, String(version))
      )
    } catch {
      /* ignore missing package files */
    }
  }

  const candidates = []
  for (const [name, version] of [...deps.entries()].slice(0, 14)) {
    try {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
        headers: { 'User-Agent': 'kevin-cyber-portfolio' },
      })
      if (!res.ok) continue
      const pkg = await res.json()
      const repoUrl =
        typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url || ''
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/i)
      if (!match) continue
      const [, owner, repo] = match

      let fundingUrls = []
      let fundingSource = ''
      try {
        const fundingRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/.github/FUNDING.yml`,
          { headers: { 'User-Agent': 'kevin-cyber-portfolio' } }
        )
        if (fundingRes.ok) {
          const yml = await fundingRes.text()
          fundingSource = `FUNDING.yml (${owner}/${repo})`
          const grab = (label) => {
            const line = yml.split('\n').find((l) => l.trim().startsWith(`${label}:`))
            if (!line) return []
            return line
              .split(':')[1]
              .replace(/[[\]"']/g, '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          }
          grab('github').forEach((u) => fundingUrls.push(`https://github.com/sponsors/${u}`))
          grab('open_collective').forEach((u) => fundingUrls.push(`https://opencollective.com/${u}`))
          grab('ko_fi').forEach((u) => fundingUrls.push(`https://ko-fi.com/${u}`))
          grab('patreon').forEach((u) => fundingUrls.push(`https://patreon.com/${u}`))
          grab('custom').forEach((u) => fundingUrls.push(u))
        }
      } catch {
        /* funding lookup is best-effort */
      }

      candidates.push({
        packageName: name,
        version,
        repository: `https://github.com/${owner}/${repo}`,
        maintainers: [owner],
        fundingUrls: [...new Set(fundingUrls)],
        fundingSource,
        verified: fundingUrls.length > 0,
        status: 'unreviewed',
        note: fundingUrls.length
          ? 'Sponsorship options verified from the maintainer-funded FUNDING.yml.'
          : 'No funding file detected — never assume a maintainer accepts sponsorship.',
        lastCheckedAt: new Date().toISOString(),
      })
    } catch {
      /* skip dependency */
    }
  }

  for (const c of candidates) {
    try {
      await repo.upsertOne('sponsorships', { packageName: c.packageName }, c)
    } catch {
      /* best-effort */
    }
  }

  return cacheSet(key, {
    ok: true,
    candidates,
    verifiedCount: candidates.filter((c) => c.verified).length,
    checkedAt: new Date().toISOString(),
    note: 'Only funding links declared in the repository FUNDING.yml are marked verified. GitHub Sponsors availability is ultimately confirmed on GitHub.',
  })
}

export async function getGithubProfileSnapshot() {
  return repo.findOne('github-accounts', {})
}
