import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
/*
 *  Digital Excellence Copyright (C) 2020 Brend Smits
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published
 *   by the Free Software Foundation version 3 of the License.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty
 *   of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *   See the GNU Lesser General Public License for more details.
 *
 *   You can find a copy of the GNU Lesser General Public License
 *   along with this program, in the LICENSE.md file in the root project directory.
 *   If not, see https://www.gnu.org/licenses/lgpl-3.0.txt
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, debounceTime } from 'rxjs/operators';
import { Project } from 'src/app/models/domain/project';
import { FormControl } from '@angular/forms';
import { InternalSearchService } from 'src/app/services/internal-search.service';
import { InternalSearchQuery } from 'src/app/models/resources/internal-search-query';
import { PaginationService } from 'src/app/services/pagination.service';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { Pagination } from 'src/app/models/domain/pagination';

/**
 * Overview of all the projects
 */
@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  /**
   * Array to receive and store the projects from the api.
   */
  public projects: Project[] = [];
  public projectsToDisplay: Project[] = [];
  public projectsTotal: Project[] = [];

  /**
   * Stores the response with the paginated projects etc. from the api.
   */
  public paginationResponse: Pagination;

  /**
   * Boolean to determine whether the component is loading the information from the api.
   */
  public projectsLoading = true;

  /**
   * FormControl for getting the input.
   */
  public searchControl: FormControl = null;

  private searchSubject = new BehaviorSubject<InternalSearchQuery>(null);

  /**
   * The amount of projects that will be displayed on a single page.
   */
  public amountOfProjectsOnSinglePage = 10;

  /**
   * The current selected page of the pagination footer.
   */
  private currentPage = 1;

  /**
   * The number of projects that are on the platform
   */
  public totalNrOfProjects = 0;

  /**
   * Default pagination option for the dropdown
   */
  public defaultPaginationOption = {
    id: 0,
    amountOnPage: 10
  };

  public showPaginationFooter = true;

  /**
   * The possible pagination options for the dropdown
   */
  public paginationDropDownOptions = [
    { id: 0, amountOnPage: 10 },
    { id: 1, amountOnPage: 20 },
    { id: 2, amountOnPage: 30 },
  ];

  constructor(
    private router: Router,
    private paginationService: PaginationService,
    private internalSearchService: InternalSearchService) {
    this.searchControl = new FormControl('');
  }

  ngOnInit(): void {
    this.getProjectsWithPaginationParams(this.currentPage, this.amountOfProjectsOnSinglePage);
    // Subscribe to search subject to debounce the input and afterwards searchAndFilter.
    this.searchSubject
      .pipe(
        debounceTime(500)
      )
      .subscribe((searchQuery) => {
        this.searchAndFilterProjects(searchQuery);
      });
  }

  /**
   * Method which triggers when the serach input receives a key up.
   * Updates the search subject with the query.
   * @param $event the event containing the info of the keyboard press.
   */
  public onSearchInput($event: KeyboardEvent): void {
    const controlValue: string = this.searchControl.value;
    if (controlValue == null || controlValue === '') {
      // No search value present, display the default project list.
      this.getProjectsWithPaginationParams(this.currentPage, this.amountOfProjectsOnSinglePage);
      this.showPaginationFooter = true;
      return;
    }

    const searchQuery: InternalSearchQuery = {
      query: controlValue
    };
    this.searchSubject.next(searchQuery);
  }

  /**
   * Checks whether there are any projects
   */
  public projectsEmpty(): boolean {
    return this.projects.length < 1;
  }

  /**
   * Triggers on project click in the list
   * @param id project id
   */
  public onProjectClick(id: number): void {
    this.router.navigate([`/project/details/${id}`]);
  }

  /**
   * Method to search for projects based on the query.
   * Filters projects based on the foundProjects matching the query.
   * Modifies the projectToDisplay list based on the filter.
   * @param query The query to search a project for.
   */
  private searchAndFilterProjects(query: InternalSearchQuery): void {
    if (query == null) {
      return;
    }
    this.internalSearchService.getSearchResultsPaginated(query, this.currentPage, this.amountOfProjectsOnSinglePage)
    .subscribe(result => {
      const foundProjects = result.results;
      if (foundProjects == null || this.projects == null) {
        return;
      }
      if (foundProjects.length < this.amountOfProjectsOnSinglePage) {
        this.showPaginationFooter = false;
      }
      this.projectsToDisplay = foundProjects;
    });
  }

  /**
   * Method that retrieves the page of the pagination footer when the user selects a new one
   * @param event holds the current page of the pagination footer, as well as the amount
   * of projects that are being displayed on a single page
   */
  pageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    this.getProjectsWithPaginationParams(this.currentPage, this.amountOfProjectsOnSinglePage);
  }

  /**
   * Method that retrieves the value that has changed from the pagination dropdown in the accordion,
   * and based on that value retrieves the paginated projects with the right parameters.
   * @param $event the identifier of the selected value
   */
  paginationDropDownSelectedValueChange($event: number) {
    this.amountOfProjectsOnSinglePage = this.paginationDropDownOptions[$event].amountOnPage;
    if (this.amountOfProjectsOnSinglePage === this.paginationResponse.totalCount) {
      this.currentPage = 1;
    }
    this.getProjectsWithPaginationParams(this.currentPage, this.amountOfProjectsOnSinglePage);
  }

  /**
   * Method that retrieves paginated projects.
   * @param currentPage the pagenumber for which we need to retrieve the projects.
   * @param numberOfProjectsOnSinglePage the number of projects that will be displayed on a single page.
   */
  private getProjectsWithPaginationParams(currentPage: number, numberOfProjectsOnSinglePage: number): void {
    this.paginationService.getProjectsPaginated(currentPage, numberOfProjectsOnSinglePage)
    .pipe(finalize(() => (this.projectsLoading = false)))
    .subscribe(
      (result) => {
        this.paginationResponse = result;
        this.projects = result.results;
        this.projectsToDisplay = result.results;
        this.totalNrOfProjects = result.totalCount;
      },
      (error: HttpErrorResponse) => {
        if (error.status !== 404) {
          console.log('Could not retrieve the projects');
        }
        throw error;
      }
    );
  }
}
