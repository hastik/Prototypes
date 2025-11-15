<?php

declare(strict_types=1);

namespace App\Presenters;

use App\Model\DashboardService;
use App\Model\DataRepository;
use Nette\Application\UI\Form;
use Nette\Utils\ArrayHash;

final class DashboardPresenter extends BasePresenter
{
    public function __construct(
        private readonly DashboardService $dashboardService,
        private readonly DataRepository $repository,
        \Nette\Security\User $user,
    ) {
        parent::__construct($user);
    }

    public function renderDefault(?string $status = null, ?string $priority = null, ?string $search = null): void
    {
        $filters = array_filter([
            'status' => $status,
            'priority' => $priority,
            'search' => $search,
        ]);

        $overview = $this->dashboardService->overview($filters);
        $this->template->projects = $overview['projects'];
        $this->template->metrics = $overview['metrics'];
        $this->template->filters = $overview['filters'];
        $this->template->filterValues = $filters;
    }

    protected function createComponentProjectForm(): Form
    {
        $form = new Form();
        $form->getElementPrototype()->addClass('form-grid');
        $form->addHidden('id');
        $form->addText('name', 'Name')->setRequired();
        $form->addText('owner', 'Owner')->setRequired();
        $form->addSelect('status', 'Status', $this->statusOptions())
            ->setPrompt('Choose status')
            ->setRequired();
        $form->addInteger('progress', 'Progress %')
            ->setDefaultValue(0)
            ->addRule(Form::INTEGER)
            ->addRule(Form::RANGE, 'Progress must be between 0 and 100', [0, 100]);
        $form->addText('timeline', 'Timeline');
        $form->addSubmit('save', 'Save Project');

        $form->onSuccess[] = function (Form $form, ArrayHash $values): void {
            $project = [
                'id' => $values->id ?: null,
                'name' => $values->name,
                'owner' => $values->owner,
                'status' => $values->status,
                'progress' => (int) $values->progress,
                'timeline' => $values->timeline,
            ];
            $this->repository->upsertProject($project);
            $this->flashMessage('Project saved');
            $this->redirect('this');
        };

        return $form;
    }

    protected function createComponentTaskForm(): Form
    {
        $form = new Form();
        $form->getElementPrototype()->addClass('form-grid');
        $projects = $this->projectPairs();
        $form->addSelect('projectId', 'Project', $projects)
            ->setPrompt('Select project')
            ->setRequired();
        $form->addText('title', 'Title')->setRequired();
        $form->addText('assignee', 'Assignee')->setRequired();
        $form->addSelect('priority', 'Priority', $this->priorityOptions())
            ->setPrompt('Priority')
            ->setRequired();
        $form->addSelect('status', 'Status', $this->statusOptions())
            ->setPrompt('Status')
            ->setRequired();
        $form->addText('dueDate', 'Due date (YYYY-MM-DD)');
        $form->addSubmit('save', 'Save Task');

        $form->onSuccess[] = function (Form $form, ArrayHash $values): void {
            $task = [
                'title' => $values->title,
                'assignee' => $values->assignee,
                'priority' => $values->priority,
                'status' => $values->status,
                'dueDate' => $values->dueDate,
            ];
            $this->repository->upsertTask($values->projectId, $task);
            $this->flashMessage('Task saved');
            $this->redirect('this', ['id' => $values->projectId]);
        };

        return $form;
    }

    public function handleDeleteProject(string $id): void
    {
        $this->repository->deleteProject($id);
        $this->flashMessage('Project removed');
        $this->redirect('this');
    }

    public function handleDeleteTask(string $projectId, string $taskId): void
    {
        $this->repository->deleteTask($projectId, $taskId);
        $this->flashMessage('Task removed');
        $this->redirect('this', ['id' => $projectId]);
    }

    private function statusOptions(): array
    {
        return [
            'backlog' => 'Backlog',
            'in-progress' => 'In progress',
            'blocked' => 'Blocked',
            'done' => 'Done',
        ];
    }

    private function priorityOptions(): array
    {
        return [
            'low' => 'Low',
            'medium' => 'Medium',
            'high' => 'High',
        ];
    }

    private function projectPairs(): array
    {
        $data = $this->repository->snapshot();
        $pairs = [];
        foreach ($data['projects'] ?? [] as $project) {
            $pairs[$project['id']] = $project['name'];
        }
        return $pairs;
    }
}
